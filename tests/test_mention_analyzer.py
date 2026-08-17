
# Tests for mention_analyzer.py


import json
import pytest
from src.mention_analyzer import MentionsAnalyzer, load_answers


class TestBrandDetection:
    

    def test_finds_exact_brand_match(self):
        
        text = "I recommend using Obsidian for note-taking."
        target = ["Obsidian"]
        competitors = {"Notion": ["Notion"]}

        mentions = MentionsAnalyzer.detect_mentions(text, "Obsidian", target, competitors)

        assert len(mentions) > 0, "Should find at least one mention"
        target_mention = next((m for m in mentions if m['brand'] == 'Obsidian'), None)
        assert target_mention is not None, "Should find Obsidian"
        assert target_mention['count'] == 1, "Should count 1 mention"

    def test_finds_brand_case_insensitive(self):

        text = "obsidian and OBSIDIAN are the same"
        target = ["Obsidian"]
        competitors = {}

        mentions = MentionsAnalyzer.detect_mentions(text, "Obsidian", target, competitors)

        target_mention = next((m for m in mentions if m['brand'] == 'Obsidian'), None)
        assert target_mention['count'] == 2, "Should find both lowercase and uppercase"

    def test_finds_brand_alias(self):

        text = "Check out Obsidian.md for your notes"
        target = ["Obsidian", "Obsidian.md"]  # "Obsidian.md" 
        competitors = {}

        mentions = MentionsAnalyzer.detect_mentions(text, "Obsidian", target, competitors)

        target_mention = next((m for m in mentions if m['brand'] == 'Obsidian'), None)
        assert target_mention is not None, "Should find brand by alias"

    def test_multiple_brand_mentions(self):
        text = "Obsidian is great. I use Obsidian daily. Obsidian rocks!"
        target = ["Obsidian"]
        competitors = {}

        mentions = MentionsAnalyzer.detect_mentions(text, "Obsidian", target, competitors)

        target_mention = next((m for m in mentions if m['brand'] == 'Obsidian'), None)
        assert target_mention['count'] == 3, "Should count all 3 mentions"

    def test_detects_competitor_mentions(self):

        text = "Notion and Roam Research are alternatives to Obsidian"
        target = ["Obsidian"]
        competitors = {
            "Notion": ["Notion"],
            "Roam Research": ["Roam Research", "Roam"]
        }
        
        mentions = MentionsAnalyzer.detect_mentions(text, "Obsidian", target, competitors)
        comp_mention = next((m for m in mentions if m['brand'] == "Notion"), None)
        assert comp_mention['count'] > 0

    def test_case_variant_aliases_counted_once(self):
        # "Razer" and "razer" are the same alias after lowercasing — a single
        # mention must not be double-counted.
        text = "Razer makes good mice."
        competitors = {"Razer": ["Razer", "razer"]}

        mentions = MentionsAnalyzer.detect_mentions(text, "Logitech", ["Logitech"], competitors)

        comp_mention = next(m for m in mentions if m['brand'] == "Razer")
        assert comp_mention['count'] == 1

    def test_case_variant_target_aliases_counted_once(self):
        text = "Razer makes good mice."
        mentions = MentionsAnalyzer.detect_mentions(text, "Razer", ["Razer", "razer"], {})

        target_mention = next(m for m in mentions if m['brand'] == "Razer")
        assert target_mention['count'] == 1

    def test_overlapping_aliases_counted_once(self):
        # "Roam" is contained in "Roam Research" — one occurrence, one count.
        text = "Roam Research is an option."
        competitors = {"Roam Research": ["Roam", "Roam Research"]}

        mentions = MentionsAnalyzer.detect_mentions(text, "Obsidian", ["Obsidian"], competitors)

        comp_mention = next(m for m in mentions if m['brand'] == "Roam Research")
        assert comp_mention['count'] == 1

    def test_handles_none_text(self):
        mentions = MentionsAnalyzer.detect_mentions(None, "Obsidian", ["Obsidian"], {})

        target_mention = next(m for m in mentions if m['brand'] == "Obsidian")
        assert target_mention['count'] == 0
        assert target_mention['found'] is False


class TestLoadAnswers:

    def test_skips_null_response_text(self, tmp_path, monkeypatch):
        run_dir = tmp_path / "data" / "results" / "run_test"
        run_dir.mkdir(parents=True)

        payload = {
            "id": 1,
            "category": "test",
            "question": "Best note app?",
            "response": {
                "openai": {"text": None},
                "anthropic": {"text": "Obsidian is great."},
                "google": None,
            },
        }
        (run_dir / "output_1.json").write_text(json.dumps(payload), encoding="utf-8")

        monkeypatch.chdir(tmp_path)
        answers = load_answers("run_test")

        assert [a.provider for a in answers] == ["anthropic"]