import json
import asyncio as aio 
from .llm_clients import ask_openai, build_client
from .queries_generator import save_queries
from .config_loader import load_brand_config

QUERIES_PATH = "data/entries/queries.json"
OUTPUT_PATH = "data/entries/queries_enhanced.json"
BATCH_SIZE = 15

async def enhance_queries():
    cfg = load_brand_config()
    language, description, category_noun = cfg['language'], cfg['description'], cfg['placeholders']['category_noun']
    
    with open(QUERIES_PATH) as f: 
        data = json.load(f)
    
    queries = data['queries']
    enhanced = []

    (provider_key, client) = build_client("openai")
    for i in range(0,len(queries),BATCH_SIZE):
        batch = queries[i:i+BATCH_SIZE]
        prompt = f"""You are helping build a brand visibility analysis tool.

  Your task is to rephrase template-generated queries into natural human questions — the kind a real person would type into an AI assistant.

  Context:
  - Industry: {description}
  - Output language: {language}

  Rules:
  - Output must be in {language}
  - Do not add any brand or product names that are not already in the query
  - Keep the original intent and topic of each query
  - Make each query sound like a genuine human question, not a search string

  Example:
  Input: 1. Best {category_noun} for small teams
  Output: [{{"id": 1, "natural": "We're a small team of 5 — what would you recommend we use?"}}]

  Return ONLY a JSON array, no other text.

  Queries:
  """
        for q in batch:
            prompt = prompt + f"{q['id']}. {q['query']}\n"
        
        answer = await ask_openai(client, prompt, "gpt-4o-mini")
        results = json.loads(answer['text'])
        for r in results:
            original = next(q for q in batch if q['id'] == r['id'])
            enhanced.append({
                'id': original['id'],
                'category': original['category'],
                'query': r['natural']
            })

    save_queries(enhanced, OUTPUT_PATH)

if __name__ == "__main__":
    aio.run(enhance_queries())
