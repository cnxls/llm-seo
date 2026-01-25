import json
from .llm_clients import pick_mode, ask_provider, ask_all_providers
import os
from datetime import datetime
import asyncio as aio
import argparse


class QueryOutput:
    def __init__(self, query_id, question, response):
        self.query_id = query_id
        self.question = question
        self.response = response

    def to_dict(self):
        return {
            'id': self.query_id,
            'question': self.question,
            'response': self.response,
        }

class QueryRunner:
    
    @staticmethod
    def load_queries():
        try:
            with open('data/entries/queries.json', 'r') as file:
                queries = json.load(file)
            return queries
        except FileNotFoundError:
            print(f"File data/entries/queries.json not found.")
            return {'queries': []}
        except json.JSONDecodeError:
            print(f"Error decoding JSON from file data/entries/queries.json.")
            return {'queries': []}
        except PermissionError:
            print(f"Permission denied reading file: data/entries/queries.json")
            return {'queries': []}
        
    @staticmethod
    def get_completed_ids(run_dir):
        completed = set()
        
        for filename in os.listdir(run_dir):
            if filename.startswith("output_") and filename.endswith(".json"):
                query_id = int(filename[7:-5])
                completed.add(query_id)
        
        return completed
    
    @staticmethod
    def filter_queries(queries, start=None, limit=None, ids=None):

        if ids is not None:
            return [q for q in queries if q['id'] in ids]
        
        result = queries
        
        # Filter by start ID
        if start is not None:
            result = [q for q in result if q['id'] >= start]
        
        # Limit
        if limit is not None:
            result = result[:limit]
        
        return result


    @staticmethod
    async def run_queries(data):
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        output_dir = f'data/results'
        run_dir = os.path.join(output_dir, f'run_{timestamp}')
        os.makedirs(run_dir, exist_ok=True)

        mode, provider = pick_mode()

        for query in data['queries']:
            query_id = query['id']
            question = query['query']
            
            
            if mode == "all":
                responses = await ask_all_providers(question)
            else:
                responses = {provider: await ask_provider(provider, question)}
            
            
            output = QueryOutput(query_id, question, responses)
            
            
            output_path = os.path.join(run_dir, f'output_{query_id}.json')
            try:
                with open(output_path, 'w') as outfile:
                    json.dump(output.to_dict(), outfile, indent=4)
                
                print(f"Query {query_id} saved to {output_path}")
            
            except FileNotFoundError:
                print(f"File {output_path} not found.")
                continue
            
            except json.JSONDecodeError:
                print(f"Error decoding JSON from file {output_path}.")
                continue
            
            except PermissionError:
                print(f"Permission denied reading file: {output_path}")
                continue

def parse_args():
    parser = argparse.ArgumentParser(description="Run queries against LLMs")
    
    parser.add_argument("--start", type=int, help="Start from this query ID")
    parser.add_argument("--limit", type=int, help="Maximum number of queries to run")
    parser.add_argument("--ids", type=str, help="Comma-separated query IDs: 1,5,10")
    parser.add_argument("--resume", type=str, help="Path to existing run directory to resume")
    
    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    if args.ids:
        args.ids = {int(x) for x in args.ids.split(',')}
    print(f"start={args.start}, limit={args.limit}, ids={args.ids}, resume={args.resume}")
    data = QueryRunner.load_queries()
    aio.run(QueryRunner.run_queries(data))
