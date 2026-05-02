from .llm_clients import ask_anthropic, build_client
import json
import re
from datetime import datetime
import os

OUTPUT_PATH = "data/entries/configs/"

async def generate_placeholders(brand_name: str, description: str, language: str) -> dict:

    with open('data/entries/config_template.json', 'r', encoding='utf-8') as file:
        cfg = json.load(file)
    prompt = f"""You are helping set up a brand visibility analysis tool.                                                                                                                                    
                                                                                                                                                                                            
  Given the following brand information, return a JSON object with the fields below.                                                                                                          
   
  Brand name: {brand_name}                                                                                                                                                                    
  What they do: {description}
  Output language: {language}

  Return ONLY a valid JSON object, no other text:

  {{
    "category": "short modifier word or phrase describing the industry (e.g. 'fast food', 'construction', 'note-taking') — in {language}",
    "category_noun": "singular noun phrase for one entity in this category (e.g. 'fast food chain', 'construction firm', 'note-taking app') — in {language}",
    "category_plural": "plural of category_noun (e.g. 'fast food chains', 'construction firms', 'note-taking apps') — in {language}",
    "use_cases": ["4 to 5 specific situations where someone would look for this type of brand — in {language}"],
    "competitors": ["5 to 8 real well-known competitor brand names in this industry — names only, not translated"]
  }}"""
    _, client = build_client("anthropic")
    result = await ask_anthropic(client=client, question=prompt, model="claude-haiku-4-5-20251001", prefill="{")
    result = json.loads(result["text"])

    cfg["brand_name"] = brand_name
    cfg["description"] = description
    cfg["language"] = language
    cfg["target"] = {"name": brand_name, "aliases": [brand_name]}
    cfg["competitors"] = [{"name": c, "aliases": [c]} for c in result["competitors"]]
    cfg["placeholders"]["category"] = result["category"]
    cfg["placeholders"]["category_noun"] = result["category_noun"]
    cfg["placeholders"]["category_plural"] = result["category_plural"]
    cfg["placeholders"]["use_cases"] = result["use_cases"]

    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    run_dir = os.path.join(OUTPUT_PATH, f'config_{timestamp}.json')
    with open(run_dir, 'w', encoding='utf-8') as outfile:
        json.dump(cfg, outfile, indent=4)
    return cfg
