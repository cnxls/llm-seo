import json
from llm_clients import pick_mode, ask_provider, ask_all_providers
import os

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
        with open('data/entries/queries.json', 'r') as file:
            queries = json.load(file)
        return queries

    @staticmethod
    def run_queries(data):
        output_dir = 'data/results'
        os.makedirs(output_dir, exist_ok=True)
        
        
        mode, provider = pick_mode()
        
        for query in data['queries']:
            query_id = query['id']
            question = query['query']
            
            
            if mode == "all":
                responses = ask_all_providers(question)
            else:
                responses = {provider: ask_provider(provider, question)}
            
            
            output = QueryOutput(query_id, question, responses)
            
            
            output_path = os.path.join(output_dir, f'output_{query_id}.json')
            with open(output_path, 'w') as outfile:
                json.dump(output.to_dict(), outfile, indent=4)
            
            print(f"Query {query_id} saved to {output_path}")


if __name__ == "__main__":
    data = QueryRunner.load_queries()
    QueryRunner.run_queries(data)