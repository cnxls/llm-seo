import json
import logging
from pathlib import Path
from .config_loader import load_brand_config
import asyncio as aio
from .llm_clients import ask_provider

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent/"data"/"entries"
OUTPUT_PATH = DATA_DIR / "queries.json"


def build_prompt(language, description, use_cases, cat_noun, cat_plural, cat_name, cat_desc):
    usecases = "\n    ".join(f"{i+1}. {uc}" for i, uc in enumerate(use_cases))
    return f"""You are building a brand visibility monitoring tool for the {language} market.

  Brand context:
  - Industry: {description}
  - Category: {cat_noun} (plural: {cat_plural})
  - Typical customer situations:
    {usecases}

  Generate exactly 10 natural {language} questions a real person would type into an AI assistant
  when looking for a {cat_noun}.

  Query category: {cat_name}
  Category intent: {cat_desc}

  Rules:
  - Write ONLY in {language}
  - Sound like a genuine human question, not a search keyword
  - Do NOT include any brand names
  - Vary phrasing and perspective across all 10
  - Each question must be self-contained

  Return ONLY a JSON array of 10 strings.
  Example: ["Question one?", "Question two?", ...]"""


def parse_query_list(text):
    try:
        text = text.strip()
        if text.startswith("```"):
            text = "\n".join(text.split("\n")[1:])
            if text.endswith("```"):
                text = "\n".join(text.split("\n")[:-1])
            text = text.strip()
        parsed = json.loads(text)
        if not isinstance(parsed, list):
            logger.warning(f"Expected list, got {type(parsed)}. Raw: {text}")
            return []
        return [str(item) for item in parsed]
    except json.JSONDecodeError:
        logger.warning(f"Failed to parse query list. Raw response: {text}")
        return []


async def generate_all_queries():
    cfg = load_brand_config()
    language = cfg['language']
    description = cfg['description']
    placeholders = cfg['placeholders']
    use_cases = placeholders['use_cases']
    cat_noun = placeholders['category_noun']
    cat_plural = placeholders['category_plural']

    categories = [
        ("recommendation",   "User wants to find the best option in this category"),
        ("comparison",       "User wants to compare options or understand differences"),
        ("problem_solving",  "User has a constraint or pain point and needs a solution"),
        ("feature_based",    "User wants something with specific features or for a specific context"),
        ("how_to",           "User wants guidance on how to evaluate or choose"),
        ("audience_specific","User asking on behalf of a specific type of person"),
        ("opinion",          "User wants subjective opinions or community sentiment"),
    ]

    all_queries = []
    id_x = 1

    for (cat_name, cat_desc) in categories:
        prompt = build_prompt(language, description, use_cases, cat_noun, cat_plural, cat_name, cat_desc)
        response = await ask_provider("openai", prompt)
        queries = parse_query_list(response['text'])
        for query in queries:
            all_queries.append({
                'id': id_x,
                'category': cat_name,
                'query': query
            })
            id_x += 1

    return all_queries


def save_queries(queries, queries_path=OUTPUT_PATH):
    config = load_brand_config()
    output = {
        "brand": config["target"]["name"],
        "competitors": [c["name"] for c in config["competitors"]],
        "queries": queries
    }

    try:
        with open(queries_path, 'w', encoding='utf-8') as outfile:
            json.dump(output, outfile, indent=2)

        logger.info(f"Saved {len(queries)} queries to {queries_path}")

    except PermissionError:
        logger.error(f"Permission denied writing to: {queries_path}")
        raise


if __name__ == "__main__":
    queries = aio.run(generate_all_queries())
    save_queries(queries)
    print(f"Generated {len(queries)} queries")
