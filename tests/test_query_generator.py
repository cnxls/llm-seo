
# Tests for queries_generator.py

import asyncio
import json
import pytest
from unittest.mock import patch, AsyncMock

from src.queries_generator import (
    build_prompt, parse_query_list, generate_all_queries, save_queries
)


class TestBuildPrompt:

    def test_includes_key_inputs(self):
        prompt = build_prompt(
            "English", "note-taking apps", ["writing notes", "organizing tasks"],
            "note-taking app", "note-taking apps", "recommendation",
            "User wants to find the best option in this category"
        )

        assert "English" in prompt
        assert "note-taking apps" in prompt
        assert "note-taking app" in prompt
        assert "writing notes" in prompt
        assert "organizing tasks" in prompt
        assert "recommendation" in prompt
        assert "User wants to find the best option in this category" in prompt


class TestParseQueryList:

    def test_parses_valid_json_array(self):
        result = parse_query_list('["Question one?", "Question two?"]')
        assert result == ["Question one?", "Question two?"]

    def test_strips_json_fence(self):
        text = '```json\n["Question one?", "Question two?"]\n```'
        result = parse_query_list(text)
        assert result == ["Question one?", "Question two?"]

    def test_non_list_json_returns_empty(self):
        result = parse_query_list('{"not": "a list"}')
        assert result == []

    def test_invalid_json_returns_empty_and_logs_warning(self, caplog):
        with caplog.at_level("WARNING"):
            result = parse_query_list("not valid json at all")
        assert result == []
        assert len(caplog.records) > 0


class TestGenerateAllQueries:

    def test_generates_sequential_queries_per_category(self):
        fake_config = {
            "language": "English",
            "description": "note-taking apps",
            "placeholders": {
                "use_cases": ["writing notes"],
                "category_noun": "note-taking app",
                "category_plural": "note-taking apps",
            },
        }

        with patch("src.queries_generator.load_brand_config", return_value=fake_config), \
             patch("src.queries_generator.ask_provider", new_callable=AsyncMock) as mock_ask:
            mock_ask.return_value = {"text": '["Query A?", "Query B?"]'}

            queries = asyncio.run(generate_all_queries())

        assert mock_ask.call_count == 7

        ids = [q["id"] for q in queries]
        assert ids == list(range(1, len(queries) + 1))

        for q in queries:
            assert set(["id", "category", "query"]).issubset(q.keys())


class TestSaveQueries:

    def test_writes_expected_json_structure(self, tmp_path):
        fake_config = {
            "target": {"name": "Obsidian"},
            "competitors": [{"name": "Notion"}, {"name": "Roam"}],
        }
        queries = [{"id": 1, "category": "recommendation", "query": "What is the best app?"}]
        output_path = tmp_path / "queries.json"

        with patch("src.queries_generator.load_brand_config", return_value=fake_config):
            save_queries(queries, queries_path=output_path)

        with open(output_path, encoding="utf-8") as f:
            data = json.load(f)

        assert data["brand"] == "Obsidian"
        assert data["competitors"] == ["Notion", "Roam"]
        assert data["queries"] == queries
