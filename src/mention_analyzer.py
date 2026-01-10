import re
import json
import os
from query_runner import QueryRunner 

def load_answers(run_dir=None):
    base_path = 'data/results'

    if run_dir is None:
        all_dirs = os.listdir(base_path)
        all_dirs = [d for d in all_dirs if os.path.isdir(os.path.join(base_path, d))]
        all_dirs.sort(key=lambda d: os.path.getmtime(os.path.join(base_path, d)), reverse=True)
        run_dir = all_dirs[0]

    run_path = os.path.join(base_path, run_dir)

    all_files = os.listdir(run_path)
    output_files = [f for f in all_files if f.startswith('output_') and f.endswith('.json')]

    results = []
    for filename in output_files:
        file_path = os.path.join(run_path, filename)
        with open(file_path, 'r') as file:
            results.append(json.load(file))

    results.sort(key=lambda x: x['id'])
    return results



def load_brands():
     with open(f'data/brands.json', 'r') as file:
          brands = json.load(file)
          return brands




print(load_answers())
