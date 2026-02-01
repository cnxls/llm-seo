# LLM SEO Monitor

Track how AI assistants (ChatGPT, Claude, Gemini) mention and recommend your brand compared to competitors.

## Why this exists

When people ask ChatGPT "what's the best note-taking app?", which apps get mentioned? How often? In what context?

This tool helps you:
- See if your brand gets recommended by AI assistants
- Compare your visibility vs competitors
- Track changes over time
- Understand what queries trigger mentions of your brand

## How it works

1. **Generate queries** — creates realistic search questions based on templates:
   - "What's the best app for [use case]?"
   - "[Brand A] vs [Brand B] for [use case]"
   - "Is [Brand] worth it for [use case]?"

2. **Enhance queries** — uses GPT-4o-mini to rephrase robotic templates into natural human questions:
   - Before: "Obsidian vs Notion for research"
   - After: "I'm a researcher trying to decide between Obsidian and Notion - which handles academic notes better?"

3. **Run queries** — sends questions to ChatGPT, Claude, and Gemini, saves all responses

4. **Analyze mentions** — parses responses to count brand mentions, sentiment, and recommendation strength

## Setup

### 1. Clone and create virtual environment

```bash
git clone <repo-url>
cd llm-seo

python -m venv .venv

.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux

pip install -r requirements.txt
```

### 2. Add API keys

Create a `.env` file in the project root:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
```

You need at least one API key. Get them from:
- OpenAI: https://platform.openai.com/api-keys
- Anthropic: https://console.anthropic.com/
- Google: https://makersuite.google.com/app/apikey

### 3. Configure your brand

Edit `data/entries/brands.json`:

```json
{
  "target": {
    "name": "Your Brand",
    "aliases": ["YourBrand", "Your-Brand", "yourbrand"]
  },
  "competitors": {
    "Competitor A": ["CompA", "Comp-A"],
    "Competitor B": ["CompB"]
  }
}
```

## Usage

All commands can be run via the CLI:

```bash
poetry run python -m src.cli generate   # Generate queries from templates
poetry run python -m src.cli enhance    # Enhance queries with LLM
poetry run python -m src.cli run        # Run queries against LLMs
poetry run python -m src.cli analyze    # Analyze brand mentions
```

### Step 1: Generate queries

```bash
poetry run python -m src.cli generate
```

Creates `data/entries/queries.json` from templates in `data/entries/query_template.json`.

### Step 2: Enhance queries (optional)

```bash
poetry run python -m src.cli enhance
```

Uses GPT-4o-mini to make queries sound natural. Creates `data/entries/queries_enhanced.json`.

### Step 3: Run queries

```bash
poetry run python -m src.cli run
```

Results saved to `data/results/run_<timestamp>/`.

For more options (limit, resume, specific IDs), run the module directly:

```bash
poetry run python -m src.query_runner --limit 5    # first 5 only
poetry run python -m src.query_runner --ids 1,5,10 # specific IDs
poetry run python -m src.query_runner --resume data/results/run_2024-01-28_14-30-00
```

### Step 4: Analyze mentions

```bash
poetry run python -m src.cli analyze
```

Analyzes the most recent run, saves `analysis.json`, and prints a summary of brand mentions.

## Running tests

```bash
python -m pytest tests/ -v
```

## Cost estimates

- Query enhancement: ~$0.01 for 133 queries
- Running queries: ~$0.10-0.50 per full run
