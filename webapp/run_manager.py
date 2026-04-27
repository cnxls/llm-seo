from src.queries_generator import generate_all_queries, save_queries
from src.query_runner import QueryOutput, generate_summary 
from datetime import datetime
from src.llm_clients import ask_all_providers
from src.mention_analyzer import load_answers, save_analysis, MentionsAnalyzer
import os
import json

active_run = {
    "running": False,
    "run_name": None,
    "total": 0,
    "completed": 0,
    "current_query": None,
    "error": None,
    "cancel_requested": False
}

async def execute_run(query_ids=None):
    active_run["running"] = True
    active_run["run_name"] = None
    active_run["completed"] = 0
    active_run["total"] = 0
    active_run["current_query"] = None
    active_run["error"] = None
    active_run["cancel_requested"] = False
    
    try:
        generated_qs = generate_all_queries()
        save_queries(generated_qs)
        
        if query_ids:                                                                                                                                                                                                                                                                        
            generated_qs = [q for q in generated_qs if q["id"] in query_ids]
        
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        run_name = f"run_{timestamp}"
        run_dir = os.path.join("data/results", run_name)
        os.makedirs(run_dir, exist_ok=True)
        active_run["run_name"] = run_name
        active_run["total"] = len(generated_qs)

        for query in generated_qs:
            if active_run["cancel_requested"]:
                break
            
            active_run['current_query'] = query['query']
            responses = await ask_all_providers(query['query'])
            
            output = QueryOutput(query['id'], query['query'], query['category'], responses)
            output_path = os.path.join(run_dir, f"output_{query['id']}.json")
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(output.to_dict(), f, indent=4, ensure_ascii=False)

            active_run['completed'] += 1

        active_run['current_query'] = 'Analyzing results...'
        generate_summary(run_dir=run_dir)
        answers = load_answers(run_name)
        analyzer = MentionsAnalyzer()
        results = analyzer.mention_analyzer(answers)
        save_analysis(results, run_name)

    except Exception as e:
        active_run['error'] = str(e)

    finally:
        active_run['running'] = False
        active_run["cancel_requested"] = False
