import json
from .llm_clients import pick_mode, ask_provider, ask_all_providers
import os
from datetime import datetime
import asyncio as aio

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
            print("File not found.")
            return {'queries': []}
        

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
            except Exception as e:
                print(f"Failed to save query {query_id} to {output_path}: {e}")

if __name__ == "__main__":
    data = QueryRunner.load_queries()
    aio.run(QueryRunner.run_queries(data))