import json
from .llm_clients import ask_provider, ask_all_providers
import os
from datetime import datetime
import asyncio as aio
import argparse


class QueryOutput:
    def __init__(self, query_id, question, category, response):
        self.query_id = query_id
        self.question = question
        self.category = category
        self.response = response

    def to_dict(self):
        return {
            'id': self.query_id,
            'question': self.question,
            'category': self.category,
            'response': self.response,
        }

class QueryRunner:
    
    @staticmethod
    def load_queries():
        try:
            with open('data/entries/queries.json', 'r', encoding='utf-8') as file:
                queries = json.load(file)
            return queries
        except FileNotFoundError:
            print("File data/entries/queries.json not found.")
            return {'queries': []}
        except json.JSONDecodeError:
            print("Error decoding JSON from file data/entries/queries.json.")
            return {'queries': []}
        except PermissionError:
            print("Permission denied reading file: data/entries/queries.json")
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
    async def process_one(semaphore, run_dir, query, counter, total, mode="all"):

        async with semaphore: 
            query_id = query['id']
            question = query['query']
            category = query['category']
            
            if mode == "all":
                responses = await ask_all_providers(question)
            else:
                responses = {mode: await ask_provider(mode, question)}
            
            
            output = QueryOutput(query_id, question, category, responses)
            
            
            output_path = os.path.join(run_dir, f'output_{query_id}.json')
            try:
                with open(output_path, 'w', encoding='utf-8') as outfile:
                    json.dump(output.to_dict(), outfile, indent=4)

                counter[0] += 1
                print(f"[{counter[0]}/{total}] Query {query_id} saved to {output_path}")
            
            except FileNotFoundError:
                print(f"File {output_path} not found.")
                return

            except PermissionError:
                print(f"Permission denied reading file: {output_path}")
                return

    @staticmethod
    async def run_queries(data, start=None, limit=None, ids=None, resume_dir=None, mode="all"):

        sem = aio.Semaphore(5)
        output_dir = 'data/results'

        if resume_dir:
            run_dir = resume_dir

            if not os.path.isdir(run_dir):
                print(f"Resume dir not found: {run_dir}")
                return 
        
        else:
            timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
            run_dir = os.path.join(output_dir, f'run_{timestamp}')
            os.makedirs(run_dir, exist_ok=True)


        queries = data['queries']
        queries = QueryRunner.filter_queries(queries, start, limit, ids)


        if resume_dir:
            completed = QueryRunner.get_completed_ids(run_dir)
            queries = [q for q in queries if q['id'] not in completed]
            print(f"Resuming: {len(completed)} done, {len(queries)} remaining")

        total = len(queries)
        counter = [0]

        tasks = [QueryRunner.process_one(semaphore=sem, query=query, run_dir=run_dir, counter=counter, total=total, mode=mode) for query in queries]

        await aio.gather(*tasks)
        generate_summary(run_dir)

def generate_summary(run_dir):
    results = []


    for filename in os.listdir(run_dir):
        if filename.startswith("output_") and filename.endswith(".json"):
            with open(os.path.join(run_dir,filename),'r', encoding='utf-8') as file:
                data = json.load(file)
                results.append(data)
    
    rundirname = os.path.basename(run_dir)
    summary = {
        "run_info": {
            "timestamp": rundirname[4:],
            "total_queries": len(results),
        },
        "results": results
    }

    output_path = os.path.join(run_dir, 'summary.json')
    with open(output_path, 'w', encoding='utf-8') as outfile:
        json.dump(summary , outfile, indent=4)
    
    print(f"Summary saved to {output_path}")


def parse_args():
    parser = argparse.ArgumentParser(description="Run queries against LLMs")
    
    parser.add_argument("--start", type=int, help="Start from this query ID")
    parser.add_argument("--limit", type=int, help="Maximum number of queries to run")
    parser.add_argument("--ids", type=str, help="Comma-separated query IDs: 1,5,10")
    parser.add_argument("--resume", type=str, help="Path to existing run directory to resume")
    parser.add_argument("--mode", type=str, default="all", choices=["all", "openai", "anthropic", "google"], help="Which provider(s) to query")

    return parser.parse_args()

if __name__ == "__main__":
    args = parse_args()
    if args.ids:
        args.ids = {int(x) for x in args.ids.split(',')}
    print(f"start={args.start}, limit={args.limit}, ids={args.ids}, resume={args.resume}")
    data = QueryRunner.load_queries()
    aio.run(QueryRunner.run_queries(data, args.start, args.limit, args.ids, args.resume, args.mode))
