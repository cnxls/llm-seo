
# Tests for mention_analyzer.py


import pytest
from src.mention_analyzer import MentionsAnalyzer


class TestBrandDetection:
    

    def test_finds_exact_brand_match(self):
        
        text = "I recommend using Obsidian for note-taking."
        target = ["Obsidian"]
        competitors = {"Notion": ["Notion"]}

        mentions = MentionsAnalyzer.detect_mentions(text, target, competitors)

        assert len(mentions) > 0, "Should find at least one mention"
        target_mention = next((m for m in mentions if m['brand'] == 'Obsidian'), None)
        assert target_mention is not None, "Should find Obsidian"
        assert target_mention['count'] == 1, "Should count 1 mention"

    def test_finds_brand_case_insensitive(self):

        text = "obsidian and OBSIDIAN are the same"
        target = ["Obsidian"]
        competitors = {}

        mentions = MentionsAnalyzer.detect_mentions(text, target, competitors)

        target_mention = next((m for m in mentions if m['brand'] == 'Obsidian'), None)
        assert target_mention['count'] == 2, "Should find both lowercase and uppercase"

    def test_finds_brand_alias(self):

        text = "Check out Obsidian.md for your notes"
        target = ["Obsidian", "Obsidian.md"]  # "Obsidian.md" 
        competitors = {}

        mentions = MentionsAnalyzer.detect_mentions(text, target, competitors)

        target_mention = next((m for m in mentions if m['brand'] == 'Obsidian'), None)
        assert target_mention is not None, "Should find brand by alias"

    def test_multiple_brand_mentions(self):
        text = "Obsidian is great. I use Obsidian daily. Obsidian rocks!"
        target = ["Obsidian"]
        competitors = {}

        mentions = MentionsAnalyzer.detect_mentions(text, target, competitors)

        target_mention = next((m for m in mentions if m['brand'] == 'Obsidian'), None)
        assert target_mention['count'] == 3, "Should count all 3 mentions"

    def test_detects_competitor_mentions(self):

        text = "Notion and Roam Research are alternatives to Obsidian"
        target = ["Obsidian"]
        competitors = {
            "Notion": ["Notion"],
            "Roam Research": ["Roam Research", "Roam"]
        }