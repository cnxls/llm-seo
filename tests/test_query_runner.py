from src.mention_analyzer import load_answers
from src.mention_analyzer import load_brands
from src.mention_analyzer import MentionsAnalyzer
import json
from src.query_runner import QueryRunner
import asyncio as aio


# #------------------------
# data = QueryRunner.load_queries()
# aio.run(QueryRunner.run_queries(data))


answers = load_answers()
answers_todict = [answer.to_dict() for answer in answers]
brandss, competitorss = load_brands()

# Debug: Check the actual content
print(answers_todict[0]['question'])
print("\nanswer length:", len(answers_todict[0]['answer']))
print("\nanswer content:")
print(answers_todict[0]['answer'])
print("\n" + "-"*50 + "\n")

# Also check the raw JSON file
import os
base_path = 'data/results'
all_dirs = sorted([d for d in os.listdir(base_path) if os.path.isdir(os.path.join(base_path, d))], 
                  key=lambda d: os.path.getmtime(os.path.join(base_path, d)), reverse=True)
latest_file = os.path.join(base_path, all_dirs[0], 'output_1.json')
with open(latest_file, 'r') as f:
    raw_data = json.load(f)
    print("raw JSON :")
    print(json.dumps(raw_data, indent=2))

print("\nMentions:")
print(MentionsAnalyzer.detect_mentions(answers_todict[0]['answer'], brandss, competitorss))