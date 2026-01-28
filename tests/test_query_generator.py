import pytest
from pathlib import Path
from unittest.mock import patch

from src.queries_generator import (
    load_templates, load_brands, get_use_cases, get_placeholders,
    fill_single_template, generate_queries_from_template,
    generate_all_queries
)


class TestGetPlaceholders:

    def test_finds_placeholders(self):
        assert get_placeholders("{brand1} vs {brand2}") == ["brand1", "brand2"]
        assert get_placeholders("No placeholders") == []
        assert get_placeholders("{s} and {s}") == ["s", "s"]


class TestFillSingleTemplate:

    def test_replaces_variables(self):
        result = fill_single_template("{brand1} vs {brand2}", {"brand1": "A", "brand2": "B"})
        assert result == "A vs B"

    def test_leaves_unknown_placeholders(self):
        result = fill_single_template("{brand1} vs {unknown}", {"brand1": "A"})
        assert result == "A vs {unknown}"


class TestLoadBrands:

    def test_returns_target_and_competitors(self):
        target, competitors = load_brands()

        assert isinstance(target, list) and len(target) > 0
        assert isinstance(competitors, dict)
        for _, aliases in competitors.items():
            assert isinstance(aliases, list)


class TestLoadTemplates:

    def test_returns_expected_structure(self):
        templates = load_templates()

        assert all(k in templates for k in ["metadata", "placeholders", "templates"])
        assert len(templates["templates"]) > 0

    def test_raises_on_missing_file(self):
        with patch('src.queries_generator.TEMPLATES_PATH', Path("nonexistent.json")):
            with pytest.raises(FileNotFoundError):
                load_templates()


class TestGetUseCases:

    def test_returns_list_of_strings(self):
        use_cases = get_use_cases()
        assert isinstance(use_cases, list) and len(use_cases) > 0
        assert all(isinstance(c, str) for c in use_cases)


class TestGenerateQueriesFromTemplate:

    def test_generates_queries(self):
        results = generate_queries_from_template(
            "What are the best {category} apps?",
            {"category": "note-taking", "use_cases": []}
        )
        assert results == ["What are the best note-taking apps?"]

    def test_fills_all_placeholders(self):
        results = generate_queries_from_template(
            "{brand1} vs {brand2} for {use_case}",
            {"category": "test", "use_cases": ["work"]}
        )
        for query in results:
            assert "{" not in query and "}" not in query


class TestGenerateAllQueries:

    def test_returns_valid_queries(self):
        queries = generate_all_queries()

        assert len(queries) > 0
        assert all(k in queries[0] for k in ["id", "category", "query"])
        assert all(q["id"] == i + 1 for i, q in enumerate(queries))
        assert all("{" not in q["query"] for q in queries)


