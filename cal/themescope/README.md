source /Users/zeynebk/venvs/themescope/bin/activate
uv pip install -e /Users/zeynebk/cal/themescope '.[llm]'
export OPENAI_API_KEY=sk-...real-key...
themescope analyze \
  --history "/Users/$USER/Library/Application Support/Google/Chrome/Default/History" \
  --include-archived \
  --method llm --llm-model gpt-4o-mini \
  --prioritize-older \
  --topics 8 \
  --out /Users/$USER/cal/themescope_out


themescope subthemes \
  --history "/Users/$USER/Library/Application Support/Google/Chrome/Default/History" \
  --prompt "deep learning research" \
  --method llm --llm-model gpt-4o-mini \
  --out /Users/$USER/cal/themescope_out

  
Analyze Chrome history to identify recurring themes, interests, values, and supporting links.

- Input: Chrome History SQLite DB path or exported CSV
- Output: JSON and Markdown report of themes over time
- Optional: integrate with chrome-history-mcp as a data source

## Install

Use uv or pipx:

```bash
uv pip install -e .
```

## Usage

```bash
themescope analyze --history "/Users/$USER/Library/Application Support/Google/Chrome/Default/History" --out out
```

Options:
- `--include-archived`: also read `Archived History` if present for deeper timeline
- `--since YYYY-MM-DD` / `--until YYYY-MM-DD`: restrict time range
- `--max-rows N`: cap total visits used for modeling (default 100k)
- `--diversity 0..1`: increase cross-month/domain diversity (default 0.5)
- `--interest-only`: drop generic/logistical links and focus on interest/values
- `--min-interest-score N`: require at least N interest-keyword hits (default 1)
- `--min-theme-size N`: drop very small themes (default 50)
- `--diverse-themes/--no-diverse-themes`: enforce diversity among selected themes (default on)

## MCP integration

Use `chrome-history-mcp` to expose history via MCP; adapt `--history` to a fetched copy. See: https://github.com/vincent-pli/chrome-history-mcp
