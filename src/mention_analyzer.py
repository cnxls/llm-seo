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

    responses = []
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
                responses.append(answer)
    
    responses.sort(key=lambda x: x.question_id)
    return responses


def load_brands():
     competitors = {}
     with open(f'data/entries/brands.json', 'r') as file:
        brands = json.load(file)
        target = brands['target']['aliases']
        for brand in brands['competitors']:
            competitors[brand['name']] = brand['aliases']
        return target, competitors



class MentionsAnalyzer:
    @staticmethod
    def detect_mentions(text: str, target: list, competitors: dict):
        text_lower = text.lower()
        mentions = []
        
        for brand_name in target:
            pattern = r'\b' + re.escape(brand_name.lower()) + r'\b'
            matches = list(re.finditer(pattern, text_lower))
            if matches:
                mentions.append({
                    'brand': brand_name,
                    'found': True,
                    'count': len(matches),
                    'positions': [match.start() for match in matches],
                    'answer_len' : len(text_lower)
                })
        return mentions
    
    @staticmethod
    def calculate_position_score( first_position: int, text_length: int):
        if first_position is None:
            return 0.0
        
        relative = first_position / text_length
        
        if relative <= 0.20:
            return 1.0
        elif relative <= 0.60:
            return 0.6
        else:
            return 0.3
    
    def mention_analyzer(self, responses):
        target, competitors = load_brands()
        analysis_results = []

        for answer in responses:     
            mentions = MentionsAnalyzer.detect_mentions()    
            for mention in mentions:
                analysis_results.append({
                'brand' : mention['brand'],
                'max_occurances' : max(mentions, key=lambda x: x["count"])["brand"],
                'score' : self.calculate_position_score(mention['positions'][0],mention['answer_len'])  
                    })
                
        return analysis_results