# ThemeScope API (minimal)

## Install

```bash
uv pip install -e ".[llm,server]"
export OPENAI_API_KEY=sk-...your-key...
```

## Use

```python
from themescope.api import get_themes_json, get_subthemes_json

# Local Chrome history path (macOS default profile)
history = "/Users/$USER/Library/Application Support/Google/Chrome/Default/History"

# 1) Core themes (labels 1–3 words, with sources)
themes = get_themes_json(
	history_path=history,
	include_archived=True,
	llm_model="gpt-4o-mini",
)
print(themes)  # {"themes": [{"label": "...", "rationale": "...", "sources": [{"title": "...", "url": "..."}]}]}

# 2) Subthemes for a prompt (with sources)
subs = get_subthemes_json(
	history_path=history,
	prompt="deep learning research",
	include_archived=True,
	llm_model="gpt-4o-mini",
	embed_model="all-MiniLM-L6-v2",
	top_n=800,
)
print(subs)  # {"subthemes": [{"label": "...", "rationale": "...", "sources": [{"title": "...", "url": "..."}]}]}
```

## Run the API server

```bash
uv pip install -e ".[server]"
uv run uvicorn themescope.api_server:app --host 127.0.0.1 --port 8000
```

Notes:
- Works with your local Chrome history (Default profile). Use other profile DBs if needed.
- Requires a valid `OPENAI_API_KEY` in the environment.
