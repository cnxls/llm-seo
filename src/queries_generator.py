import json
import logging
from pathlib import Path
from typing import Dict
import re
from .config_loader import load_brand_config

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent/"data"/"entries"
TEMPLATES_PATH = DATA_DIR / "query_template.json"
OUTPUT_PATH = DATA_DIR / "queries.json"


def load_templates() -> Dict:
    try:
        with open(TEMPLATES_PATH, 'r', encoding='utf-8') as file:
            return json.load(file)
    
    except FileNotFoundError:
        logger.error(f"File {TEMPLATES_PATH} not found.")
        raise  FileNotFoundError
    
    except json.JSONDecodeError:
        logger.error(f"Error decoding JSON from file {TEMPLATES_PATH}.")
        raise json.JSONDecodeError

    except PermissionError:
        logger.error(f"Permission denied reading file: {TEMPLATES_PATH}")
        raise PermissionError



def get_use_cases():
    usecases = load_brand_config()['placeholders']['use_cases']
    return usecases


def get_placeholders(template):
    return re.findall(r'\{(\w+)\}',template)


def fill_single_template(template, variables):
    result = template
    for key in variables:
        result = result.replace(f'{{{key}}}', variables[key])
    return result


def generate_queries_from_template(template, placeholders):
    needed = get_placeholders(template)
    use_cases = get_use_cases()

    base_vars = {
        "category": placeholders["category"],
        "category_noun": placeholders["category_noun"],
        "category_plural": placeholders["category_plural"],
    }

    case_list = use_cases if "use_case" in needed else [None]
    
    results = []
    for case in case_list:
        variables = {**base_vars}
        if case:
            variables["use_case"] = case
        query = fill_single_template(template, variables)
        results.append(query)

    return results

def generate_all_queries():
    template_data = load_templates()
    all_queries = []
    id_x = 1
    placeholders = load_brand_config()["placeholders"]
    for category, templates in template_data["templates"].items():
        for template in templates:
            queries = generate_queries_from_template(template, placeholders)

            for query in queries:
                all_queries.append({
                    'id': id_x,
                    'category' : category,
                    'query' : query
                })
                id_x+=1 
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
    queries = generate_all_queries()
    save_queries(queries)
    print(f"Generated {len(queries)} queries")