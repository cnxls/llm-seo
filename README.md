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

2. **Enhance queries** — uses an LLM to rephrase robotic templates into natural human questions:
   - Before: "Obsidian vs Notion for research"
   - After: "I'm a researcher trying to decide between Obsidian and Notion - which handles academic notes better?"

3. **Run queries** — sends questions to ChatGPT, Claude, and Gemini, saves all responses

4. **Analyze mentions** — parses responses to count brand mentions, sentiment, and recommendation strength

## Setup

### 1. Clone and create virtual environment

```bash
git clone https://github.com/cnxls/llm-seo
cd llm-seo
poetry install
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

Run the onboarding wizard from the web dashboard (see below) — it saves a config to `data/entries/configs/`. The config shape looks like:

```json
{
  "brand_name": "Your Brand",
  "description": "",
  "language": "en",
  "placeholders": {
    "category": "note-taking app",
    "category_noun": "app",
    "category_plural": "apps",
    "use_cases": ["research", "journaling"]
  },
  "target": {
    "name": "Your Brand",
    "aliases": ["YourBrand", "Your-Brand", "yourbrand"]
  },
  "competitors": [
    {"name": "Competitor A", "aliases": ["CompA", "Comp-A"]},
    {"name": "Competitor B", "aliases": ["CompB"]}
  ]
}
```

The wizard auto-generates placeholders and translates query templates into the user's language.

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

Creates `data/entries/queries.json` from templates in the active config (falls back to `data/entries/query_template.json`). Templates use `category`, `category_noun`, `category_plural`, and `use_cases` placeholders.

### Step 2: Enhance queries (optional)

```bash
poetry run python -m src.cli enhance
```

Uses an LLM to make queries sound natural. Creates `data/entries/queries_enhanced.json`.

### Step 3: Run queries

```bash
poetry run python -m src.cli run
```

Results saved to `data/results/run_<timestamp>/`.

For more options (limit, resume, specific IDs), run the module directly:

```bash
poetry run python -m src.query_runner --limit 5    # first 5 only
poetry run python -m src.query_runner --ids 1,5,10 # specific IDs
poetry run python -m src.query_runner --resume data/results/run_2026-03-30_14-30-00
poetry run python -m src.query_runner --mode openai # only query one provider (all|openai|anthropic|google)
```

### Step 4: Analyze mentions

```bash
poetry run python -m src.cli analyze
```

Analyzes the most recent run, saves `analysis.json`, and prints a summary of brand mentions.

## Web dashboard

The dashboard is a React frontend talking to a FastAPI backend. Start both:

```bash
poetry run uvicorn webapp.app:app --reload
cd frontend && npm install && npm run dev
```

Open `http://localhost:5173` in your browser. From there you can:
- Onboard a new brand through a wizard that builds the config for you
- Run queries and watch progress in real time
- View mention stats, provider comparison charts, and per-query breakdowns
- Compare two runs side by side
- Save and load configurations for different analyses
- Browse a glossary of LLM SEO terms

## Running tests

```bash
python -m pytest tests/ -v
```

## Cost estimates

- Query enhancement: ~$0.01 for 133 queries
- Running queries: ~$0.10-0.50 per full run
