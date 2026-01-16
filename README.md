# LLM-SEO Monitor

**Track how Large Language Models (LLMs) mention your brand compared to competitors.**

When people ask ChatGPT, Claude, or Gemini questions like "What's the best note-taking app?", which brands get recommended? This tool helps you monitor your brand's visibility in AI-generated responses—a new frontier for SEO and brand awareness.

---

## Why This Matters

LLMs are becoming the new search engines. Unlike traditional SEO where you optimize for Google's algorithms, LLM-SEO is about understanding how AI models perceive and recommend your product. This tool helps you:

- **Track brand mentions** across OpenAI (ChatGPT), Anthropic (Claude), and Google (Gemini)
- **Compare against competitors** to see who's winning in AI recommendations
- **Analyze positioning** by tracking where your brand appears in responses
- **Monitor trends** over time by running queries regularly

**Example use case:** If you work for Obsidian (a note-taking app), you can track how often Claude recommends Obsidian vs Notion vs Roam Research when users ask about productivity tools.

---

## Features

✅ **Multi-Provider Support** - Query OpenAI, Anthropic, and Google LLMs simultaneously
✅ **Brand Mention Detection** - Automatically finds your brand and competitors in responses
✅ **Position Tracking** - Measures where brands appear (first mention = more visibility)
✅ **JSON Export** - Stores results in structured format for analysis
✅ **Flexible Queries** - Run custom queries relevant to your industry
✅ **Async Processing** - Fast parallel API calls to minimize wait time

---

## Prerequisites

Before you start, make sure you have:

- **Python 3.11 or higher** ([Download here](https://www.python.org/downloads/))
- **Poetry** for dependency management ([Installation guide](https://python-poetry.org/docs/#installation))
- **API Keys** from:
  - [OpenAI](https://platform.openai.com/api-keys) (ChatGPT)
  - [Anthropic](https://console.anthropic.com/settings/keys) (Claude)
  - [Google AI Studio](https://aistudio.google.com/app/apikey) (Gemini)

---

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/llm-seo.git
cd llm-seo
```

### 2. Install dependencies
```bash
poetry install
```

This will create a virtual environment and install all required packages.

### 3. Set up your API keys

**Option A: Using a `.env` file (Recommended for local development)**

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your real API keys:
   ```env
   OPENAI_API_KEY=sk-proj-your-actual-openai-key-here
   ANTHROPIC_API_KEY=sk-ant-your-actual-anthropic-key-here
   GOOGLE_API_KEY=your-actual-google-key-here
   ```

**Option B: Using environment variables**

Set them directly in your terminal:

- **Windows (PowerShell):**
  ```powershell
  $env:OPENAI_API_KEY='your-key-here'
  $env:ANTHROPIC_API_KEY='your-key-here'
  $env:GOOGLE_API_KEY='your-key-here'
  ```

- **Mac/Linux:**
  ```bash
  export OPENAI_API_KEY='your-key-here'
  export ANTHROPIC_API_KEY='your-key-here'
  export GOOGLE_API_KEY='your-key-here'
  ```

---

## Configuration

### Setting Up Your Brand and Competitors

Edit `data/entries/brands.json` to track your brand:

```json
{
  "target": {
    "name": "YourBrand",
    "aliases": ["YourBrand", "YourBrand.com", "YB"]
  },
  "competitors": [
    {
      "name": "Competitor1",
      "aliases": ["Competitor1", "Comp1"]
    },
    {
      "name": "Competitor2",
      "aliases": ["Competitor2"]
    }
  ]
}
```

**Why aliases?** LLMs might mention your brand in different ways ("Notion" vs "Notion.so"). Aliases ensure all variations are detected.

### Creating Your Queries

Edit `data/entries/queries.json` to define what questions you want to ask:

```json
{
  "brand": "YourBrand",
  "competitors": ["Competitor1", "Competitor2"],
  "queries": [
    {
      "id": 1,
      "category": "recommendation",
      "query": "What are the best tools for [your use case]?",
      "keywords": ["tools", "best", "recommendation"]
    },
    {
      "id": 2,
      "category": "comparison",
      "query": "YourBrand vs Competitor1",
      "keywords": ["comparison", "vs"]
    }
  ]
}
```

### Adjusting LLM Settings

Edit `config.yaml` to control LLM behavior:

```yaml
llm:
  default_provider: openai  # Choose: openai, anthropic, google
  temperature: 0.2          # Lower = more consistent responses
  max_tokens: 800           # Maximum response length
  timeout_seconds: 60       # Request timeout
```

---

## Usage

### Running Queries

**Interactive Mode:**
```bash
poetry run python -m src.query_runner
```

You'll be prompted to choose:
- **All providers** - Query OpenAI, Anthropic, and Google for each question
- **Single provider** - Query only ChatGPT, Claude, or Gemini

The tool will:
1. Load your queries from `data/entries/queries.json`
2. Send each query to the selected LLM(s)
3. Save responses to `data/results/run_YYYY-MM-DD_HH-MM-SS/`

**Example output:**
```
Query 1 saved to data/results/run_2024-01-15_14-30-45/output_1.json
Query 2 saved to data/results/run_2024-01-15_14-30-45/output_2.json
...
```

### Analyzing Brand Mentions

After running queries, analyze which brands were mentioned:

```bash
poetry run python -m src.mention_analyzer
```

This will:
1. Load the most recent query results
2. Scan responses for your brand and competitors
3. Calculate metrics:
   - **Mention count** - How many times the brand appears
   - **Position score** - Where it appears (earlier = better)
   - **First mention position** - Character position of first occurrence

---

## Understanding Results

### Query Results Format

Each query produces a JSON file in `data/results/run_*/output_N.json`:

```json
{
  "id": 1,
  "question": "What are the best note-taking apps?",
  "response": {
    "openai": {
      "text": "The best note-taking apps include Notion, Obsidian, and Roam Research...",
      "model": "gpt-4o-mini",
      "tokens": {
        "input": 23,
        "output": 156,
        "total": 179
      }
    },
    "anthropic": {
      "text": "...",
      "model": "claude-sonnet-4-5",
      "tokens": {...}
    },
    "google": {...}
  }
}
```

### Mention Analysis Format

The mention analyzer produces insights like:

```json
{
  "brand": "Obsidian",
  "mention_count": 3,
  "position_score": 0.15,
  "first_mention_position": 127
}
```

**Interpreting metrics:**
- **Higher mention count** = More frequently recommended
- **Lower position score** = Mentioned earlier in the response (better visibility)
- **Lower first mention position** = Appears sooner in the text

---

## Project Structure

```
llm-seo/
├── data/
│   ├── entries/
│   │   ├── brands.json       # Your brand + competitors
│   │   └── queries.json      # Questions to ask LLMs
│   └── results/              # Query results (timestamped folders)
│       └── run_YYYY-MM-DD_HH-MM-SS/
│           └── output_N.json
├── src/
│   ├── config_loader.py      # Loads config.yaml and API keys
│   ├── llm_clients.py        # Handles OpenAI/Anthropic/Google API calls
│   ├── query_runner.py       # Runs queries and saves results
│   └── mention_analyzer.py   # Analyzes brand mentions in results
├── config.yaml               # LLM configuration
├── .env                      # API keys (DO NOT COMMIT)
├── .env.example              # Template for .env file
├── pyproject.toml            # Python dependencies
└── README.md                 # This file
```

---

## Cost Estimates

API calls cost money. Here's a rough estimate per query:

| Provider  | Model              | Cost per 1M tokens | ~Cost per query |
|-----------|--------------------|--------------------|-----------------|
| OpenAI    | gpt-4o-mini        | $0.15 (input)      | ~$0.001         |
| Anthropic | claude-sonnet-4-5  | $3.00 (input)      | ~$0.005         |
| Google    | gemini-2.5-flash   | $0.075 (input)     | ~$0.0002        |

**Example:** Running 20 queries across all 3 providers = ~60 API calls ≈ **$0.12**

💡 **Tip:** Start with a single provider to minimize costs while testing.

---

## Troubleshooting

### "Missing API key for openai"
- Make sure you created a `.env` file (see Installation step 3)
- Verify your API key is correct (no extra spaces)
- Check that `.env` is in the project root directory

### "Module not found" errors
```bash
# Make sure you're using Poetry:
poetry install
poetry run python -m src.query_runner
```

### "Rate limit exceeded"
- You're sending requests too fast
- Wait a few minutes and try again
- Consider using a single provider instead of "all"

### No results in `data/results/`
- Check that `data/entries/queries.json` has queries
- Look for error messages in the terminal output
- Verify your API keys are valid

---

## Advanced Usage

### Running Tests
```bash
poetry run pytest
```

### Custom Query Categories

You can organize queries by category:
- `recommendation` - "What's the best X?"
- `comparison` - "X vs Y"
- `how-to` - "How do I do Z?"
- `problem-solving` - "I have problem X, what should I use?"

This helps you understand which types of questions favor your brand.

### Tracking Changes Over Time

Run queries weekly/monthly and compare results:
```bash
# Week 1
poetry run python -m src.query_runner
# Results saved to run_2024-01-01_10-00-00/

# Week 2
poetry run python -m src.query_runner
# Results saved to run_2024-01-08_10-00-00/

# Compare the two runs to see if your brand visibility improved
```

---

## Contributing

Found a bug or have a feature request? [Open an issue](https://github.com/yourusername/llm-seo/issues).

---

## License

MIT License - Feel free to use this for commercial or personal projects.

---

## Disclaimer

This tool is for research and monitoring purposes. Be mindful of:
- **API costs** - Each query costs money
- **Rate limits** - Don't spam API endpoints
- **Terms of Service** - Use responsibly according to each provider's ToS

---

**Questions?** Open an issue or reach out!
