import logging
import re
import json
import os
from .query_runner import QueryRunner 

OUTPUT_DIR = 'data/results'

logger = logging.getLogger(__name__)

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
        try:
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
        except FileNotFoundError:
            logger.error(f"File {file_path} not found.")
            print(f"File {file_path} not found.")
            continue
        except json.JSONDecodeError:
            logger.error(f"Error decoding JSON  {file_path}.")
            print(f"Error decoding JSON from file {file_path}.")
            continue
        except PermissionError:
            print(f"Permission denied reading file: {file_path}")
            continue

    responses.sort(key=lambda x: x.question_id)
    return responses


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
        print("Brands file not found.")
        return [], {}




class MentionsAnalyzer:
    @staticmethod
    def detect_mentions(text: str, target: list, competitors: dict):
        text_lower = text.lower()
        text_length = len(text)
        mentions = []
        
        target_matches = []
        for alias in target:
            pattern = r'\b' + re.escape(alias.lower()) + r'\b'
            matches = list(re.finditer(pattern, text_lower))
            target_matches.extend(matches)
        
        target_matches.sort(key=lambda m: m.start())
        mentions.append({
            'brand': json.load(open('data/entries/brands.json', 'r'))['target']['name'],
            'is_target': True,
            'found': len(target_matches) > 0,
            'count': len(target_matches),
            'first_position': target_matches[0].start() if target_matches else None,
            'text_length': text_length
        })
        
        for brand_name, aliases in competitors.items():
            brand_matches = []
            for alias in aliases:
                pattern = r'\b' + re.escape(alias.lower()) + r'\b'
                matches = list(re.finditer(pattern, text_lower))
                brand_matches.extend(matches)
            
            brand_matches.sort(key=lambda m: m.start())
            mentions.append({
                'brand': brand_name,
                'is_target': False,
                'found': len(brand_matches) > 0,
                'count': len(brand_matches),
                'first_position': brand_matches[0].start() if brand_matches else None,
                'text_length': text_length
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
            mentions = MentionsAnalyzer.detect_mentions(answer.answer, target, competitors)  
            max_brand = max(mentions, key=lambda x: x['count'])['brand']
              
            for mention in mentions:
                analysis_results.append({
                'question_id': answer.question_id,
                'brand' : mention['brand'],
                'is_target': mention['is_target'],
                'found': mention['found'],
                'count': mention['count'],
                'most_mentioned' : max_brand,
                'score' : self.calculate_position_score(
                    mention['first_position'],
                    mention['text_length'])  
                    })
                
        return analysis_results
    
    async def mention_analyzer_async(self, responses):
        import asyncio as aio

        chunk_size = 10
        all_results = []
        
        for i in range(0, len(responses), chunk_size):
            chunk = responses[i:i + chunk_size]
            
            result = await aio.to_thread(self.mention_analyzer, chunk)
            all_results.extend(result)
        
        return all_results





def save_analysis(results, run_dir=None):
    base_path = 'data/results'
    
    if run_dir is None:
        all_dirs = os.listdir(base_path)
        all_dirs = [d for d in all_dirs if os.path.isdir(os.path.join(base_path, d))]
        all_dirs.sort(key=lambda d: os.path.getmtime(os.path.join(base_path, d)), reverse=True)
        run_dir = all_dirs[0]
    
    output_path = os.path.join(base_path, run_dir, 'analysis.json')
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=4)
    
    print(f"Analysis saved to {output_path}")

def print_summary(results): 
    brands = {}
    for r in results:
        brand = r['brand']
        if brand not in  brands:
            brands[brand] =  {'count': 0, 'score_sum': 0, 'found': 0, 'is_target': r['is_target']}
        brands[brand]['count'] += r['count']
        brands[brand]['score_sum'] += r['score']
        if r['found']: 
            brands[brand]['found'] += 1

    print("\n Brand Mentions Summary \n")
    for brand, stats in sorted(brands.items(), key=lambda x: x[1]['count'], reverse=True):
        avg_score = stats['score_sum'] / len(results) * len(brands)
        marker = " (TARGET)" if stats['is_target'] else ""
        print(f"{brand}{marker}: {stats['count']} mentions, found in {stats['found']} answers, avg score: {avg_score:.2f}")


if __name__ == "__main__":
    responses = load_answers()
    analyzer = MentionsAnalyzer()
    results = analyzer.mention_analyzer(responses)
    
    save_analysis(results)
    print_summary(results)