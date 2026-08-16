"""In-process cache for LLM-generated queries.

`generate_all_queries()` fires one LLM call per query category (7 total) every
time it is invoked. Both the `/api/queries/preview` endpoint and `execute_run()`
need the same list, so without a cache a single session regenerates it several
times over. This module wraps the generator with a fingerprint of the brand
config inputs that actually feed `build_prompt()`, so identical inputs reuse the
previous result and any config edit forces a fresh generation.
"""

import asyncio
import json
from pathlib import Path

from src.config_loader import load_brand_config
from src.queries_generator import generate_all_queries

_cache = {
    "fingerprint": None,
    "queries": None,
}

_lock = asyncio.Lock()

# The in-process cache is empty after every server restart (and every --reload
# reload), which made the first page load pay the full ~6s generation again even
# though nothing about the brand config had changed. Mirror the cache to disk so
# a restart reuses the previous result.
CACHE_PATH = Path(__file__).resolve().parent.parent / "data" / "entries" / "query_cache.json"


def _read_disk_cache(fingerprint):
    """Queries previously generated for this fingerprint, or None."""
    try:
        with CACHE_PATH.open("r", encoding="utf-8") as fh:
            stored = json.load(fh)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return None
    if stored.get("fingerprint") != fingerprint:
        return None
    queries = stored.get("queries")
    return queries or None


def _write_disk_cache(fingerprint, queries):
    try:
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        with CACHE_PATH.open("w", encoding="utf-8") as fh:
            json.dump({"fingerprint": fingerprint, "queries": queries}, fh, indent=2, ensure_ascii=False)
    except OSError:
        pass


def compute_fingerprint(cfg=None):
    """Stable string built from every brand-config value used in the prompts."""
    cfg = cfg if cfg is not None else load_brand_config()
    language = cfg["language"]
    placeholders = cfg["placeholders"]
    payload = {
        "language": language,
        "market": cfg.get("market") or language,
        "description": cfg["description"],
        "use_cases": placeholders["use_cases"],
        "category_noun": placeholders["category_noun"],
        "category_plural": placeholders["category_plural"],
    }
    return json.dumps(payload, sort_keys=True, ensure_ascii=False)


async def get_queries():
    """Return the generated query list, reusing the cache when inputs are unchanged."""
    async with _lock:
        fingerprint = compute_fingerprint()
        if fingerprint == _cache["fingerprint"] and _cache["queries"] is not None:
            return _cache["queries"]

        queries = _read_disk_cache(fingerprint)
        if queries is None:
            queries = await generate_all_queries()
            _write_disk_cache(fingerprint, queries)

        _cache["fingerprint"] = fingerprint
        _cache["queries"] = queries
        return queries


def invalidate():
    """Drop the cached queries (next call regenerates)."""
    _cache["fingerprint"] = None
    _cache["queries"] = None
    try:
        CACHE_PATH.unlink()
    except OSError:
        pass
