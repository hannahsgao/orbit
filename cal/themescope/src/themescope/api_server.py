from typing import Optional
import os

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from .api import get_themes_json, get_subthemes_json
from .history import ChromeHistoryReader
from .utils import normalize_url_for_dedup
from .persona import summarize_cluster


app = FastAPI(title="ThemeScope API")

app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"http://localhost:5173",
		"http://127.0.0.1:5173",
		"http://localhost:3000",
	],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.get("/orbit")
def get_orbit(
	history: str = Query(..., description="Path to Chrome History SQLite DB"),
	include_archived: bool = True,
	themes_min: int = 5,
	themes_max: int = 8,
	subs_min: int = 2,
	subs_max: int = 4,
	sources_min: int = 2,
	sources_max: int = 4,
	llm_model: str = "gpt-4o-mini",
	embed_model: str = "all-MiniLM-L6-v2",
) -> dict:
	"""Return combined themes → subthemes → sources JSON for the orbit app."""
	def _clamp(n: int, lo: int, hi: int) -> int:
		return max(lo, min(hi, n))

	# Expand env vars and ~ in history path
	history_expanded = os.path.expandvars(os.path.expanduser(history))

	# Ensure themes_list is always defined even if persona call fails
	themes_list: list = []

	# First attempt via persona (LLM). Expected to produce 5–8, but may return fewer.
	try:
		themes_json = get_themes_json(history_path=history_expanded, include_archived=include_archived, llm_model=llm_model)
		themes_list = themes_json.get("themes", []) or []
	except Exception:
		# Graceful fallback when OpenAI or other deps fail: produce a single heuristic theme
		reader = ChromeHistoryReader(history_expanded)
		df = reader.load(include_archived=include_archived)
		if df.empty:
			return {"themes": []}
			titles = df["title"].fillna("").tolist()
			summary = summarize_cluster([t for t in titles])
			themes_list = [{"label": (summary.split(",")[0][:24] or "Theme"), "rationale": summary, "sources": []}]

	# Fallback: if fewer than themes_min, force LLM to return at least min themes directly from titles
	if len(themes_list) < themes_min:
		reader = ChromeHistoryReader(history_expanded)
		df = reader.load(include_archived=include_archived)
		if df.empty:
			return {"themes": []}
		# Dedup and gather titles
		df = df.copy()
		df["canon_url"] = df["url"].map(normalize_url_for_dedup)
		df = df.sort_values("visit_time", ascending=False).drop_duplicates("canon_url")
		titles = df["title"].fillna("").tolist()
		try:
			from openai import OpenAI
			client = OpenAI()
			prompt = (
				"You analyze browsing titles to infer core interests.\n"
				f"Return STRICT JSON ONLY with 5-8 distinct themes (never fewer). Schema: {{\"themes\":[{{\"label\":str,\"rationale\":str,\"sources\":[{{\"title\":str,\"url\":str}}]}}]}}.\n"
				"Rules: 1-3 word labels; if titles are sparse, extrapolate plausible, diverse interests consistent with the titles.\n"
				"Filter logistics (auth, email, calendar, docs, shipping, banking, carts).\n"
				"Items:\n" + "\n".join(f"- {t[:200]}" for t in titles)
			)
			resp = client.chat.completions.create(
				model=llm_model,
				messages=[{"role":"user","content": prompt}],
				temperature=0.2,
			)
			import json as _json
			content = (resp.choices[0].message.content or "").strip()
			data = _json.loads(content)
			themes_list = data.get("themes", []) or []
		except Exception:
			# Fallback: heuristic single theme from summary (rare)
			summary = summarize_cluster([t for t in titles])
			themes_list = [{"label": summary.split(",")[0][:24] or "Theme", "rationale": summary, "sources": []}]

	# Final clamp for persona path + LLM-fallback
	desired_themes = _clamp(len(themes_list), themes_min, themes_max)
	selected_themes = themes_list[:desired_themes]

	# Final clamp for normal (persona) path
	desired_themes = _clamp(len(themes_list), themes_min, themes_max)
	selected_themes = themes_list[:desired_themes]

	out = {"themes": []}
	for th in selected_themes:
		label = th.get("label") or ""
		rationale = th.get("rationale") or ""
		sources = th.get("sources") or []
		try:
			subs_json = get_subthemes_json(
				history_path=history_expanded,
				prompt=label,
				include_archived=include_archived,
				llm_model=llm_model,
				embed_model=embed_model,
				top_n=800,
			)
			subs = subs_json.get("subthemes", [])
		except Exception:
			subs = []
		n_subs = _clamp(len(subs), subs_min, subs_max)
		selected_subs = subs[:n_subs]
		out_subs = []
		for sub in selected_subs:
			ss_sources = sub.get("sources") or []
			n_src = _clamp(len(ss_sources), sources_min, sources_max)
			out_subs.append({
				"label": sub.get("label") or "",
				"rationale": sub.get("rationale") or "",
				"sources": ss_sources[:n_src],
			})
		n_theme_src = _clamp(len(sources), sources_min, max(sources_min, min(sources_max, 6)))
		out["themes"].append({
			"label": label,
			"rationale": rationale,
			"sources": sources[:n_theme_src],
			"subthemes": out_subs,
		})

	return out


