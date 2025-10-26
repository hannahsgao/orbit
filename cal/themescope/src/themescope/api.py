from typing import Optional, Dict, Any

import datetime as dt

from .history import ChromeHistoryReader
from .utils import normalize_url_for_dedup
from .persona import (
	llm_persona_json,
	llm_subthemes_json,
	semantic_filter,
)


def get_themes_json(
	history_path: str,
	include_archived: bool = True,
	since: Optional[str] = None,
	until: Optional[str] = None,
	llm_model: str = "gpt-4o-mini",
) -> Dict[str, Any]:
	reader = ChromeHistoryReader(history_path)
	since_dt = dt.datetime.fromisoformat(since) if since else None
	until_dt = dt.datetime.fromisoformat(until) if until else None
	df = reader.load(since=since_dt, until=until_dt, include_archived=include_archived)
	if df.empty:
		return {"themes": []}
	# Titles only for LLM persona
	return llm_persona_json(df["title"].fillna("").tolist(), client=_get_openai_client(), model=llm_model)


def get_subthemes_json(
	history_path: str,
	prompt: str,
	include_archived: bool = True,
	llm_model: str = "gpt-4o-mini",
	embed_model: str = "all-MiniLM-L6-v2",
	top_n: int = 800,
) -> Dict[str, Any]:
	reader = ChromeHistoryReader(history_path)
	df = reader.load(include_archived=include_archived)
	if df.empty:
		return {"subthemes": []}
	# Dedup and select relevant
	df["canon_url"] = df["url"].map(normalize_url_for_dedup)
	df = df.sort_values("visit_time", ascending=False).drop_duplicates("canon_url")
	df["item"] = df["title"].fillna("") + " — " + df["url"].fillna("")
	idx = semantic_filter(df["item"].tolist(), prompt, model_name=embed_model, top_n=top_n)
	items = (df.iloc[idx]["title"].fillna("") + " — " + df.iloc[idx]["url"].fillna("")).tolist()
	return llm_subthemes_json(prompt, items, client=_get_openai_client(), model=llm_model)


def _get_openai_client():
	from openai import OpenAI
	return OpenAI()


