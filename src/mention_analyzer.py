import re
import json
import os
from .query_runner import QueryRunner 


class Answer:
    def __init__(self, question_id, question, answer):
        self.question_id = question_id
        self.question = question
        self.answer = answer

    def to_dict(self):
        return {
            'id': self.question_id,
            'question': self.question,
            'answer': self.answer
        }


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
            data = json.load(file)
            for provider, response_data in data['response'].items():

                if response_data is None:
                    continue
                    
                answer = Answer(
                    question_id=data['id'],
                    question=data['question'],
                    answer=response_data['text']
                )
                results.append(answer)
    
    results.sort(key=lambda x: x.question_id)
    return results


def load_brands():
     with open(f'data/entries/brands.json', 'r') as file:
        brands = json.load(file)
        target = brands['target']['aliases']
        competitors = [brand['aliases'] for brand in brands['competitors']]
        return target, competitors
     
# print(load_brands())
# print(load_answers())
# print(load_brands())

def mention_analyzer():
    target, competitors = load_brands()
    raw_answers = load_answers()
