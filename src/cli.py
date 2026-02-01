import argparse
import asyncio as aio

def main():
    parser = argparse.ArgumentParser(description="LLM SEO Monitor")
    subparsers = parser.add_subparsers(dest="command")
    
    subparsers.add_parser("generate", help="Generate queries from templates")
    subparsers.add_parser("enhance", help="Enhance queries with LLM")
    subparsers.add_parser("run", help="Run queries against LLMs")
    subparsers.add_parser("analyze", help="Analyze brand mentions")

    args = parser.parse_args()

    if args.command == "generate":
        from .queries_generator import generate_all_queries, save_queries
        queries = generate_all_queries()
        save_queries(queries)

    elif args.command == "enhance":
        from .query_enhancer import enhance_queries
        aio.run(enhance_queries())

    elif args.command == "run":
        from .query_runner import QueryRunner
        runner = QueryRunner()
        aio.run(runner.run_queries())
        
    elif args.command == "analyze":
        from .mention_analyzer import load_answers, MentionsAnalyzer, save_analysis, print_summary
        responses = load_answers()
        analyzer = MentionsAnalyzer()
        results =  analyzer.mention_analyzer(responses)
        save_analysis(results)
        print_summary(results)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()