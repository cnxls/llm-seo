import json
import asyncio as aio 
from .llm_clients import ask_openai, build_client
from .queries_generator import save_queries

QUERIES_PATH = "data/entries/queries.json"
OUTPUT_PATH = "data/entries/queries_enhanced.json"
BATCH_SIZE = 15

async def enhance_queries():
    with open(QUERIES_PATH) as f: 
        data = json.load(f)

    queries = data['queries']
    enhanced = []

    for i in range(0,len(queries),BATCH_SIZE):
        batch = queries[i:i+BATCH_SIZE]
        prompt = "Rephrase these to sound human. Keep brands. Return JSON array.\n\n"
        for q in batch:
            prompt = prompt + f"{q['id']}. {q['query']}\n"
        client = build_client()
        answer = await ask_openai(client, prompt, "gpt-4o-mini")
        enhanced.append(json.loads(answer))

        save_queries(enhanced, OUTPUT_PATH)

if __name__ == "__main__":
    aio.run(enhance_queries())
