import json
import logging
from pathlib import Path
from typing import Dict, List, Any
import re

logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent.parent/"data"/"entries"
TEMPLATES_PATH = DATA_DIR / "query_template.json"
BRANDS_PATH = DATA_DIR / "brands.json"
OUTPUT_PATH = DATA_DIR / "queries.json"


def load_templates() -> Dict:
    try:
        with open(TEMPLATES_PATH, 'r') as file:
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



def load_brands():
    competitors = {}
    try:
        with open(f'data/entries/brands.json', 'r') as file:
            brands = json.load(file)
            target = brands['target']['aliases']
            for brand in brands['competitors']:
                competitors[brand['name']] = brand['aliases']
            return target, competitors 
    except FileNotFoundError:
        print("Brands not found.")
        return [], {}



def get_use_cases():
    usecases = load_templates()['placeholders']['use_cases']
    return usecases


def get_placeholders(template):
    return re.findall(r'\{(\w+)\}',template)


def fill_single_template(template, variables):
    result = template
    for key in variables:
        result = result.replace(f'{{{key}}}', variables[key])
    return result


def generate_queries_from_template(template, placeholders):
    target, competitors = load_brands()
    needed = get_placeholders(template)
    use_cases = get_use_cases()
    
    base_vars = {
        "category": placeholders["category"],
        "target": target[0],
        "brand1": target[0]
    }
    
    needs_competitor = "brand1" in needed or "competitor" in needed
    comp_list = list(competitors.keys()) if needs_competitor else [None]
    case_list = use_cases if "use_case" in needed else [None]
    
    results = []
    for comp in comp_list:
        for case in case_list:
            variables = {**base_vars}
            
            if comp:
                variables["brand2"] = comp
                variables["competitor"] = comp
            if case:
                variables["use_case"] = case
            
            query = fill_single_template(template, variables)
            results.append(query)
    
    return results

def generate_all_queries():
    template_data = load_templates()
    all_queries = []
    id_x = 1
    placeholders = template_data["placeholders"]
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
    """Save all generated queries to JSON file."""
    target, competitors = load_brands()
    
    output = {
        "brand": target[0],
        "competitors": list(competitors.keys()),
        "queries": queries  # Already a list of {"id": ..., "category": ..., "query": ...}
    }
    
    try:
        with open(queries_path, 'w', encoding='utf-8') as outfile:
            json.dump(output, outfile, indent=2)
        
        logger.info(f"Saved {len(queries)} queries to {queries_path}")
        
    except PermissionError:
        logger.error(f"Permission denied writing to: {queries_path}")
        raise
