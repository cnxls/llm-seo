import json
import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
RESULTS_DIR = DATA_DIR / "results"
ENTRIES_DIR = DATA_DIR / "entries"


def list_runs():
    if not RESULTS_DIR.exists():
        return []

    runs = []
    for d in RESULTS_DIR.iterdir():
        if not d.is_dir():
            continue
        output_files = list(d.glob("output_*.json"))
        runs.append({
            "name": d.name,
            "query_count": len(output_files),
            "has_analysis": (d / "analysis.json").exists(),
        })

    runs.sort(key=lambda r: r["name"], reverse=True)
    return runs


def load_brands():
    path = ENTRIES_DIR / "brands.json"
    with open(path, "r") as f:
        data = json.load(f)

    target = data["target"]
    competitors = [c["name"] for c in data["competitors"]]
    return {
        "target": target["name"],
        "target_aliases": target["aliases"],
        "competitors": competitors,
        "competitor_aliases": {c["name"]: c["aliases"] for c in data["competitors"]},
    }


def load_queries():
    path = ENTRIES_DIR / "queries.json"
    if not path.exists():
        return []
    with open(path, "r") as f:
        data = json.load(f)
    return data.get("queries", [])


def load_raw_responses(run_name):
    run_path = RESULTS_DIR / run_name
    responses = []
    for f in sorted(run_path.glob("output_*.json")):
        with open(f, "r") as fh:
            responses.append(json.load(fh))
    return responses


def load_analysis(run_name):
    run_path = RESULTS_DIR / run_name
    analysis_path = run_path / "analysis.json"

    if analysis_path.exists():
        with open(analysis_path, "r") as f:
            analysis = json.load(f)
        if analysis and "provider" in analysis[0]:
            return analysis

    # Analysis is missing or lacks provider field — rebuild from raw outputs
    return _build_analysis(run_name)


def _build_analysis(run_name):
    raw = load_raw_responses(run_name)
    brands_data = load_brands()

    target_name = brands_data["target"]
    target_aliases = brands_data["target_aliases"]
    competitor_aliases = brands_data["competitor_aliases"]

    # Try to get categories from queries.json
    queries = load_queries()
    query_categories = {q["id"]: q["category"] for q in queries}

    results = []
    for entry in raw:
        qid = entry["id"]
        category = entry.get("category") or query_categories.get(qid, "unknown")

        for provider, response_data in entry["response"].items():
            if response_data is None:
                continue

            text = response_data["text"]
            mentions = _detect_mentions(text, target_name, target_aliases, competitor_aliases)
            max_brand = max(mentions, key=lambda m: m["count"])["brand"]

            for mention in mentions:
                results.append({
                    "question_id": qid,
                    "category": category,
                    "provider": provider,
                    "brand": mention["brand"],
                    "is_target": mention["is_target"],
                    "found": mention["found"],
                    "count": mention["count"],
                    "most_mentioned": max_brand,
                    "score": _position_score(mention["first_position"], mention["text_length"]),
                })

    return results


def _detect_mentions(text, target_name, target_aliases, competitor_aliases):
    text_lower = text.lower()
    text_length = len(text)
    mentions = []

    # Target
    target_matches = []
    for alias in target_aliases:
        for m in re.finditer(r'\b' + re.escape(alias.lower()) + r'\b', text_lower):
            target_matches.append(m)
    target_matches.sort(key=lambda m: m.start())
    mentions.append({
        "brand": target_name,
        "is_target": True,
        "found": len(target_matches) > 0,
        "count": len(target_matches),
        "first_position": target_matches[0].start() if target_matches else None,
        "text_length": text_length,
    })

    # Competitors
    for brand_name, aliases in competitor_aliases.items():
        brand_matches = []
        for alias in aliases:
            for m in re.finditer(r'\b' + re.escape(alias.lower()) + r'\b', text_lower):
                brand_matches.append(m)
        brand_matches.sort(key=lambda m: m.start())
        mentions.append({
            "brand": brand_name,
            "is_target": False,
            "found": len(brand_matches) > 0,
            "count": len(brand_matches),
            "first_position": brand_matches[0].start() if brand_matches else None,
            "text_length": text_length,
        })

    return mentions


def _position_score(first_position, text_length):
    if first_position is None:
        return 0.0
    relative = first_position / text_length
    if relative <= 0.20:
        return 1.0
    elif relative <= 0.60:
        return 0.6
    else:
        return 0.3


def get_brand_summary(analysis):
    brands = {}
    for r in analysis:
        brand = r["brand"]
        if brand not in brands:
            brands[brand] = {
                "brand": brand,
                "is_target": r["is_target"],
                "count": 0,
                "score_sum": 0.0,
                "found": 0,
                "wins": 0,
            }
        brands[brand]["count"] += r["count"]
        brands[brand]["score_sum"] += r["score"]
        if r["found"]:
            brands[brand]["found"] += 1
        if r["most_mentioned"] == brand:
            brands[brand]["wins"] += 1

    num_brands = len(brands)
    total = len(analysis)
    result = []
    for brand, stats in brands.items():
        avg_score = stats["score_sum"] / total * num_brands if total else 0
        result.append({
            "brand": stats["brand"],
            "is_target": stats["is_target"],
            "mentions": stats["count"],
            "found_in": stats["found"],
            "avg_score": round(avg_score, 2),
            "wins": stats["wins"],
        })

    result.sort(key=lambda x: x["mentions"], reverse=True)
    return result


def get_provider_comparison(analysis, target_brand):
    by_provider = {}
    provider_totals = {}

    for r in analysis:
        provider = r.get("provider", "unknown")
        if provider not in provider_totals:
            provider_totals[provider] = 0
        provider_totals[provider] += 1

        if r["brand"] != target_brand:
            continue

        if provider not in by_provider:
            by_provider[provider] = {"count": 0, "score_sum": 0.0, "found": 0, "wins": 0}

        by_provider[provider]["count"] += r["count"]
        by_provider[provider]["score_sum"] += r["score"]
        if r["found"]:
            by_provider[provider]["found"] += 1
        if r["most_mentioned"] == target_brand:
            by_provider[provider]["wins"] += 1

    providers = sorted(by_provider.keys())
    num_brands = len(set(r["brand"] for r in analysis))

    return {
        "providers": providers,
        "mentions": [by_provider[p]["count"] for p in providers],
        "avg_scores": [
            round(by_provider[p]["score_sum"] / provider_totals[p] * num_brands, 2)
            if provider_totals.get(p) else 0
            for p in providers
        ],
        "wins": [by_provider[p]["wins"] for p in providers],
        "found_in": [by_provider[p]["found"] for p in providers],
    }


def get_category_performance(analysis, target_brand):
    categories = {}

    for r in analysis:
        cat = r.get("category", "unknown")
        if cat not in categories:
            categories[cat] = {"total": 0, "target_wins": 0}

        if r["is_target"]:
            categories[cat]["total"] += 1
            if r["most_mentioned"] == target_brand:
                categories[cat]["target_wins"] += 1

    cat_names = sorted(categories.keys())
    return {
        "categories": cat_names,
        "win_rates": [
            round(categories[c]["target_wins"] / categories[c]["total"] * 100, 1)
            if categories[c]["total"] else 0
            for c in cat_names
        ],
        "total_queries": [categories[c]["total"] for c in cat_names],
        "target_wins": [categories[c]["target_wins"] for c in cat_names],
    }


def load_templates():
    path = ENTRIES_DIR / "query_template.json"
    if not path.exists():
        return {}
    with open(path, "r") as f:
        return json.load(f)


def save_brands(data):
    path = ENTRIES_DIR / "brands.json"
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def save_templates(data):
    path = ENTRIES_DIR / "query_template.json"
    with open(path, "w") as f:
        json.dump(data, f, indent=2)


def load_brands_raw():
    path = ENTRIES_DIR / "brands.json"
    with open(path, "r") as f:
        return json.load(f)


def get_query_details(analysis, run_name):
    raw = load_raw_responses(run_name)
    questions = {entry["id"]: entry["question"] for entry in raw}

    by_query = {}
    for r in analysis:
        qid = r["question_id"]
        if qid not in by_query:
            by_query[qid] = {
                "question_id": qid,
                "category": r.get("category", "unknown"),
                "question": questions.get(qid, ""),
                "providers": {},
            }
        provider = r.get("provider", "unknown")
        if provider not in by_query[qid]["providers"]:
            by_query[qid]["providers"][provider] = {"brands": [], "winner": None}

        by_query[qid]["providers"][provider]["brands"].append({
            "brand": r["brand"],
            "is_target": r["is_target"],
            "count": r["count"],
            "found": r["found"],
            "score": r["score"],
        })
        if r["most_mentioned"] == r["brand"]:
            by_query[qid]["providers"][provider]["winner"] = r["brand"]

    result = sorted(by_query.values(), key=lambda x: x["question_id"])
    return result
