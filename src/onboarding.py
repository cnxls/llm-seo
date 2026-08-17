from .llm_clients import ask_anthropic, build_client
import asyncio
import json
import re
from datetime import datetime
import os

OUTPUT_PATH = "data/entries/configs/"
TEMPLATES_PATH = "data/entries/query_template.json"


async def translate_templates(client, templates: dict, language: str) -> dict:
    if language.strip().lower() == "english":
        return templates
    prompt = f"""Translate the string values in the following JSON to {language}.
Preserve every {{placeholder}} token EXACTLY (e.g. {{category}}, {{category_noun}}, {{category_plural}}, {{use_case}}). Do not translate the placeholder names.
Keep the JSON structure identical: same keys, same array lengths.
Only translate the natural-language strings — leave the keys and placeholders unchanged.

Input JSON:
{json.dumps(templates, ensure_ascii=False, indent=2)}

Return ONLY the translated JSON object, no other text."""
    resp = await ask_anthropic(
        client=client,
        question=prompt,
        model="claude-haiku-4-5-20251001",
        prefill="{",
        max_tokens=4000,
    )
    try:
        return json.loads(resp["text"])
    except json.JSONDecodeError:
        return templates


def build_aliases(name: str) -> list:
    variants = [name, name.lower(), name.replace(" ", "-"), name.replace(" ", "")]
    seen_keys = set()
    result = []
    for v in variants:
        key = v.lower()
        if key in seen_keys:
            continue
        seen_keys.add(key)
        result.append(v)
    return result


def build_competitors(competitors: list, brand_name: str) -> list:
    brand_key = brand_name.strip().lower()
    seen = set()
    result = []
    for c in competitors:
        c = c.strip()
        if not c:
            continue
        key = c.lower()
        if key == brand_key or key in seen:
            continue
        seen.add(key)
        result.append({"name": c, "aliases": build_aliases(c)})
    return result


async def regenerate_competitors(brand_name: str, description: str, language: str, market: str, exclude: list = None) -> list:
    exclude = [e for e in (exclude or []) if e.strip()]
    exclude_line = f"\n  Already suggested (do NOT repeat any of these): {', '.join(exclude)}" if exclude else ""
    prompt = f"""You are finding real competitor brands for a brand visibility analysis tool.

  Brand: {brand_name}
  What they do: {description}
  Market / localisation: {market} (where this brand actually operates){exclude_line}

  List 5 to 8 real, currently operating competitor brands that people in {market} would genuinely
  compare {brand_name} against.

  Rules:
  - Only real, currently operating brands — no invented or defunct brands
  - Do not include {brand_name} itself
  - Do not repeat any brand from the "already suggested" list above
  - Mix well-known market leaders with closer, more specific alternatives
  - Names only, not translated

  Return ONLY a JSON array of strings, no other text.
  Example: ["Brand A", "Brand B"]"""
    _, client = build_client("anthropic")
    result = await ask_anthropic(client=client, question=prompt, model="claude-sonnet-4-6")
    match = re.search(r"\[.*\]", result["text"], re.DOTALL)
    names = json.loads(match.group(0) if match else result["text"])

    # Prompt instructions aren't guaranteed to be followed — filter defensively
    # instead of trusting the LLM not to repeat an excluded name.
    exclude_keys = {e.lower() for e in exclude}
    names = [n for n in names if n.strip().lower() not in exclude_keys]

    return build_competitors(names, brand_name)


async def generate_placeholders(brand_name: str, description: str, language: str, market: str) -> dict:

    with open('data/entries/config_template.json', 'r', encoding='utf-8') as file:
        cfg = json.load(file)
    prompt = f"""You are helping set up a brand visibility analysis tool.

  Given the following brand information, return a JSON object with the fields below.

  Brand name: {brand_name}
  What they do: {description}
  Output language: {language}
  Market / localisation: {market} (where this brand actually operates — e.g. "Global", "Ukraine only", "Poland")

  Return ONLY a valid JSON object, no other text:

  {{
    "category": "short modifier word or phrase describing the industry (e.g. 'fast food', 'construction', 'note-taking') — in {language}",
    "category_noun": "singular noun phrase for one entity in this category (e.g. 'fast food chain', 'construction firm', 'note-taking app') — in {language}",
    "category_plural": "plural of category_noun (e.g. 'fast food chains', 'construction firms', 'note-taking apps') — in {language}",
    "use_cases": ["4 to 5 specific situations where someone would look for this type of brand — in {language}"],
    "competitors": ["5 to 8 real, currently operating competitor brands that people in {market} would genuinely compare {brand_name} against — well-known names only, no invented or defunct brands, do not include {brand_name} itself — names only, not translated"]
  }}"""
    _, client = build_client("anthropic")

    with open(TEMPLATES_PATH, 'r', encoding='utf-8') as file:
        templates = json.load(file)

    # Placeholder generation and template translation are independent LLM
    # calls (translation only needs `language`, not the placeholder result),
    # so run them concurrently instead of one after the other.
    placeholders_result, translated_templates = await asyncio.gather(
        ask_anthropic(client=client, question=prompt, model="claude-sonnet-4-6"),
        translate_templates(client, templates, language),
    )

    text = placeholders_result["text"]
    match = re.search(r"\{.*\}", text, re.DOTALL)
    result = json.loads(match.group(0) if match else text)

    cfg["brand_name"] = brand_name
    cfg["description"] = description
    cfg["language"] = language
    cfg["market"] = market
    cfg["target"] = {"name": brand_name, "aliases": build_aliases(brand_name)}
    cfg["competitors"] = build_competitors(result["competitors"], brand_name)
    cfg["placeholders"]["category"] = result["category"]
    cfg["placeholders"]["category_noun"] = result["category_noun"]
    cfg["placeholders"]["category_plural"] = result["category_plural"]
    cfg["placeholders"]["use_cases"] = result["use_cases"]
    cfg["templates"] = translated_templates

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    run_dir = os.path.join(OUTPUT_PATH, f'config_{timestamp}.json')
    with open(run_dir, 'w', encoding='utf-8') as outfile:
        json.dump(cfg, outfile, indent=4)
    return cfg
