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

from src.config_loader import load_brand_config
from src.queries_generator import generate_all_queries

_cache = {
    "fingerprint": None,
    "queries": None,
}

_lock = asyncio.Lock()


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

        queries = await generate_all_queries()
        _cache["fingerprint"] = fingerprint
        _cache["queries"] = queries
        return queries


def invalidate():
    """Drop the cached queries (next call regenerates)."""
    _cache["fingerprint"] = None
    _cache["queries"] = None
