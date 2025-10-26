import os
import json
import click
from rich.console import Console
from rich.table import Table
from typing import Optional
import datetime as dt
import numpy as np

from .history import ChromeHistoryReader
from .nlp import normalize_text, extract_topics, top_terms_per_topic, select_diverse_topic_indices
from .persona import cluster_texts, summarize_cluster, llm_persona_from_titles, semantic_filter, llm_subthemes_from_titles, llm_persona_json, llm_subthemes_json
from .utils import extract_domain, is_generic_link, interest_score, normalize_url_for_dedup, categorize_theme_from_keywords
from .api import get_themes_json, get_subthemes_json

console = Console()


@click.group()
def main():
	"""ThemeScope CLI"""
	pass


@main.command()
@click.option("--history", "history_path", required=True, type=click.Path(exists=True), help="Path to Chrome History SQLite DB")
@click.option("--since", required=False, help="YYYY-MM-DD start date")
@click.option("--until", required=False, help="YYYY-MM-DD end date")
@click.option("--out", "out_dir", required=True, type=click.Path(), help="Output directory")
@click.option("--topics", default=10, show_default=True, help="Max number of topics/themes")
@click.option("--include-archived", is_flag=True, default=False, help="Also read 'Archived History' if present")
@click.option("--max-rows", default=100000, show_default=True, help="Max visits to consider pre-modeling")
@click.option("--diversity", default=0.5, show_default=True, type=float, help="0..1: higher favors cross-month/domain diversity")
@click.option("--interest-only", is_flag=True, default=False, help="Filter out generic/logistical links and keep interest/value content")
@click.option("--min-interest-score", default=1, show_default=True, help="Minimum interest keyword hits to include a visit")
@click.option("--min-theme-size", default=50, show_default=True, help="Minimum visits for a theme to be kept")
@click.option("--diverse-themes", is_flag=True, default=True, help="Pick diverse themes rather than similar ones")
@click.option("--method", type=click.Choice(["nmf", "embed", "llm"], case_sensitive=False), default="nmf", show_default=True, help="Theme extraction method")
@click.option("--embed-model", default="all-MiniLM-L6-v2", show_default=True, help="SentenceTransformers model for embeddings")
@click.option("--llm-model", default="gpt-4o-mini", show_default=True, help="LLM model for persona extraction")
@click.option("--prioritize-older", is_flag=True, default=False, help="Prefer older items in sampling, dedup, and ranking")
def analyze(history_path: str, since: Optional[str], until: Optional[str], out_dir: str, topics: int, include_archived: bool, max_rows: int, diversity: float, interest_only: bool, min_interest_score: int, min_theme_size: int, diverse_themes: bool, method: str, embed_model: str, llm_model: str, prioritize_older: bool):
	os.makedirs(out_dir, exist_ok=True)
	since_dt = dt.datetime.fromisoformat(since) if since else None
	until_dt = dt.datetime.fromisoformat(until) if until else None

	console.log(f"Reading history from {history_path}")
	reader = ChromeHistoryReader(history_path)
	df = reader.load(since=since_dt, until=until_dt, include_archived=include_archived)
	if df.empty:
		console.print("[yellow]No history entries in the selected range.")
		return

	# Diversity-aware sampling: cap per-month and per-domain
	df["month"] = df["visit_time"].dt.to_period("M").astype(str)
	from collections import defaultdict
	per_month_cap = max(200, int((max_rows / max(1, df["month"].nunique())) * (0.5 + 0.5 * diversity)))
	per_domain_cap = max(50, int(100 * diversity))

	def sample_group(g):
		g = g.copy()
		g["domain"] = g["url"].map(extract_domain)
		# Within month, cap per domain
		g = g.sort_values("visit_time", ascending=True if prioritize_older else False)
		g = g.groupby("domain", as_index=False, group_keys=False).head(per_domain_cap)
		return g.head(per_month_cap)

	df_sampled = df.groupby("month", as_index=False, group_keys=False).apply(sample_group)

	# Interest/value filtering
	if interest_only:
		mask_generic = df_sampled.apply(lambda r: is_generic_link(r["url"], r["title"]), axis=1)
		df_sampled = df_sampled[~mask_generic].copy()
		df_sampled["interest_score"] = df_sampled.apply(lambda r: interest_score(r["url"], r["title"]), axis=1)
		df_sampled = df_sampled[df_sampled["interest_score"] >= int(min_interest_score)]
	if len(df_sampled) > max_rows:
		df_sampled = df_sampled.head(max_rows)

	# Deduplicate near-identical links by canonical URL, keep most recent
	df_sampled["canon_url"] = df_sampled["url"].map(normalize_url_for_dedup)
	df_sampled = df_sampled.sort_values("visit_time", ascending=True if prioritize_older else False)
	df_sampled = df_sampled.drop_duplicates(subset=["canon_url"], keep="first")

	texts = (df_sampled["title"].fillna("") + " " + df_sampled["url"].fillna("")).map(normalize_text).tolist()

	themes = []
	if method == "nmf":
		console.log("Extracting topics via NMF...")
		result = extract_topics(texts, n_topics=topics)
		if not result or result[0] is None:
			console.print("[red]Insufficient data for topic modeling.")
			return
		model, W, H, terms = result
		tops = top_terms_per_topic(H, terms, top_k=10)

		# Assign dominant topic per visit
		dom = np.argmax(W, axis=1)
		df_sampled["theme"] = dom
	elif method == "embed":
		console.log("Clustering via embeddings...")
		assign, centers = cluster_texts(texts, k=topics, model_name=embed_model)
		df_sampled["theme"] = assign
		tops = None
	else:
		# LLM path: compile titles and call LLM to produce themes markdown directly
		console.log("Inferring persona via LLM...")
		try:
			from openai import OpenAI
		except Exception:
			console.print("[red]openai package not installed. Install extras: uv pip install -e .[llm]")
			return
		client = OpenAI()
		md = llm_persona_from_titles(df_sampled["title"].fillna("").tolist(), client=client, model=llm_model)
		# Save markdown and JSON and exit
		out_md = os.path.join(out_dir, "themes.md")
		with open(out_md, "w") as f:
			f.write(md)
		console.print(f"[green]Wrote {out_md}")
		# JSON API version
		data = llm_persona_json(df_sampled["title"].fillna("").tolist(), client=client, model=llm_model)
		out_json = os.path.join(out_dir, "themes.json")
		with open(out_json, "w") as f:
			json.dump(data, f, indent=2)
		return

	# Build theme summaries and representative links
	# Optionally select a diverse set of themes
	if method == "nmf":
		all_indices = list(range(len(tops)))
		theme_indices = all_indices
		if diverse_themes:
			counts = np.array([(df_sampled["theme"] == i).sum() for i in all_indices])
			theme_indices = select_diverse_topic_indices(H, counts, desired_k=min(topics, len(all_indices)), lambda_diversity=0.7, top_terms=tops, jaccard_threshold=0.6)
	else:
		all_indices = list(range(int(df_sampled["theme"].max()) + 1))
		theme_indices = all_indices

	for t_idx in theme_indices:
		keywords = tops[t_idx] if tops is not None else [summarize_cluster(texts=np.array(texts)[df_sampled["theme"] == t_idx].tolist())]
		theme_df = df_sampled[df_sampled["theme"] == t_idx].copy()
		if theme_df.empty:
			continue
		if len(theme_df) < int(min_theme_size):
			continue
		# Representative links: top visit_count and recency blend
		if prioritize_older:
			theme_df["age_score"] = -theme_df["visit_time"].astype(int) / 1e9
			theme_df["popularity"] = theme_df["visit_count"].fillna(0)
			theme_df["rank"] = 0.7 * theme_df["popularity"] + 0.3 * theme_df["age_score"]
		else:
			theme_df["recency_score"] = theme_df["visit_time"].astype(int) / 1e9
			theme_df["popularity"] = theme_df["visit_count"].fillna(0)
			theme_df["rank"] = 0.7 * theme_df["popularity"] + 0.3 * theme_df["recency_score"]
		theme_df["domain"] = theme_df["url"].map(extract_domain)
		reps = (theme_df.sort_values("rank", ascending=False)
						.head(15)[["url", "title", "visit_time", "domain"]])

		# Time-consistency: how broadly distributed across months the theme is
		theme_df["month"] = theme_df["visit_time"].dt.to_period("M").astype(str)
		months = theme_df["month"].nunique()
		total = len(theme_df)
		consistency = round(min(1.0, months / max(3, total / 20)), 3)

		# Top domains for this theme
		# Exclude generic domain list from the report to avoid over-generic info
		domain_counts = []
		themes.append({
			"id": int(t_idx),
			"keywords": keywords,
			"count": int(len(theme_df)),
			"time_consistency": consistency,
			"top_domains": domain_counts,
			"examples": reps.to_dict(orient="records"),
			"category": categorize_theme_from_keywords(keywords)
		})

	# Save JSON
	out_json = os.path.join(out_dir, "themes.json")
	with open(out_json, "w") as f:
		json.dump({"themes": themes}, f, indent=2, default=str)
	console.print(f"[green]Wrote {out_json}")

	# Save Markdown
	out_md = os.path.join(out_dir, "themes.md")
	with open(out_md, "w") as f:
		f.write("# Themes\n\n")
		if not themes:
			f.write("No themes found after current filters. Try relaxing flags (e.g., remove --interest-only or lower --min-interest-score, lower --min-theme-size, increase --max-rows).\n")
		else:
			for th in themes:
				f.write(f"## Theme {th['id']}: {', '.join(th['keywords'][:6])}\n\n")
				f.write(f"- Items: {th['count']}\n")
				f.write(f"- Time consistency: {th['time_consistency']}\n")
				f.write(f"- Top domains: {', '.join(th['top_domains'])}\n\n")
				f.write("Top links:\n\n")
				for ex in th["examples"][:10]:
					f.write(f"- [{ex.get('title') or ex['url']}]({ex['url']}) ({ex.get('domain','')})\n")
				f.write("\n")
	console.print(f"[green]Wrote {out_md}")

	# Print table
	table = Table(title="Themes")
	table.add_column("ID")
	table.add_column("Keywords")
	table.add_column("Items")
	for th in themes:
		table.add_row(str(th["id"]), ", ".join(th["keywords"]), str(th["count"]))
	console.print(table)


@main.command()
@click.option("--history", "history_path", required=True, type=click.Path(exists=True), help="Path to Chrome History SQLite DB")
@click.option("--prompt", required=True, help="Theme prompt to derive subthemes from")
@click.option("--out", "out_dir", required=True, type=click.Path(), help="Output directory")
@click.option("--method", type=click.Choice(["embed", "llm"], case_sensitive=False), default="embed", show_default=True)
@click.option("--embed-model", default="all-MiniLM-L6-v2", show_default=True)
@click.option("--llm-model", default="gpt-4o-mini", show_default=True)
def subthemes(history_path: str, prompt: str, out_dir: str, method: str, embed_model: str, llm_model: str):
	"""Generate subthemes under a user-provided theme/prompt with sources."""
	os.makedirs(out_dir, exist_ok=True)
	reader = ChromeHistoryReader(history_path)
	df = reader.load()
	if df.empty:
		console.print("[yellow]No history entries found.")
		return
	# Dedup and prepare items
	df["canon_url"] = df["url"].map(normalize_url_for_dedup)
	df = df.sort_values("visit_time", ascending=False).drop_duplicates("canon_url")
	df["item"] = df["title"].fillna("") + " — " + df["url"].fillna("")

	if method == "embed":
		idx = semantic_filter(df["item"].tolist(), prompt, model_name=embed_model, top_n=800)
		rel = df.iloc[idx]
		# Simple k-means on embeddings for subthemes
		assign, _ = cluster_texts(rel["item"].tolist(), k=8, model_name=embed_model)
		rel = rel.copy()
		rel["subtheme"] = assign
		groups = []
		for s in sorted(rel["subtheme"].unique()):
			g = rel[rel["subtheme"] == s].head(20)
			groups.append({"label": f"Group {int(s)}", "items": g[["title", "url"]].to_dict("records")})
		md = ["# Subthemes\n"]
		for g in groups:
			md.append(f"## Subtheme: {g['label']}")
			for it in g["items"]:
				md.append(f"- [{it['title'] or it['url']}]({it['url']})")
		md = "\n".join(md) + "\n"
	else:
		try:
			from openai import OpenAI
		except Exception:
			console.print("[red]openai package not installed. Install extras: uv pip install -e .[llm]")
			return
		client = OpenAI()
		idx = semantic_filter(df["item"].tolist(), prompt, model_name=embed_model, top_n=800)
		rel = df.iloc[idx]
		items = (rel["title"].fillna("") + " — " + rel["url"].fillna("")).tolist()
		md = llm_subthemes_from_titles(prompt, items, client=client, model=llm_model)
		data = llm_subthemes_json(prompt, items, client=client, model=llm_model)

	# Write output
	out_md = os.path.join(out_dir, "subthemes.md")
	with open(out_md, "w") as f:
		f.write(md)
	console.print(f"[green]Wrote {out_md}")
	out_json = os.path.join(out_dir, "subthemes.json")
	with open(out_json, "w") as f:
		json.dump(data if 'data' in locals() else {"groups": groups}, f, indent=2)


@main.command(name="export-orbit")
@click.option("--history", "history_path", required=True, type=click.Path(exists=True), help="Path to Chrome History SQLite DB")
@click.option("--out", "out_file", required=True, type=click.Path(), help="Output JSON file for orbit data")
@click.option("--themes-min", default=5, show_default=True, help="Minimum number of themes (level 1)")
@click.option("--themes-max", default=8, show_default=True, help="Maximum number of themes (level 1)")
@click.option("--subs-min", default=2, show_default=True, help="Minimum subthemes per theme (level 2)")
@click.option("--subs-max", default=4, show_default=True, help="Maximum subthemes per theme (level 2)")
@click.option("--sources-min", default=2, show_default=True, help="Minimum sources per subtheme (level 3)")
@click.option("--sources-max", default=4, show_default=True, help="Maximum sources per subtheme (level 3)")
@click.option("--include-archived", is_flag=True, default=True, show_default=True, help="Also read 'Archived History' if present")
@click.option("--llm-model", default="gpt-4o-mini", show_default=True)
@click.option("--embed-model", default="all-MiniLM-L6-v2", show_default=True)
def export_orbit(history_path: str, out_file: str, themes_min: int, themes_max: int, subs_min: int, subs_max: int, sources_min: int, sources_max: int, include_archived: bool, llm_model: str, embed_model: str):
	"""Export combined Themescope data for the orbit app: themes → subthemes → sources.

	The output schema:
	{
	  "themes": [
	    {
	      "label": str,
	      "rationale": str,
	      "sources": [{"title": str, "url": str}],
	      "subthemes": [
	        {
	          "label": str,
	          "rationale": str,
	          "sources": [{"title": str, "url": str}]
	        }
	      ]
	    }
	  ]
	}
	"""
	import json as _json

	def _clamp_count(n: int, lo: int, hi: int) -> int:
		return max(lo, min(hi, n))

	console.log("Inferring core themes...")
	themes_json = get_themes_json(history_path=history_path, include_archived=include_archived, llm_model=llm_model)
	themes_list = themes_json.get("themes", [])
	if not themes_list:
		console.print("[yellow]No themes inferred. Exiting.")
		with open(out_file, "w") as f:
			_json.dump({"themes": []}, f, indent=2)
		return

	# Select 5–8 themes if available
	desired_themes = _clamp_count(len(themes_list), themes_min, themes_max)
	selected_themes = themes_list[:desired_themes]

	# For each theme, derive subthemes and clamp 2–4; for each subtheme clamp 2–4 sources
	output = {"themes": []}
	for th in selected_themes:
		label = th.get("label") or ""
		rationale = th.get("rationale") or ""
		sources = th.get("sources") or []
		console.log(f"Subthemes for: {label}")
		subs_json = get_subthemes_json(history_path=history_path, prompt=label, include_archived=include_archived, llm_model=llm_model, embed_model=embed_model, top_n=800)
		subs = subs_json.get("subthemes", [])
		# Clamp subthemes
		n_subs = _clamp_count(len(subs), subs_min, subs_max)
		selected_subs = subs[:n_subs]
		out_subs = []
		for sub in selected_subs:
			ss_label = sub.get("label") or ""
			ss_rat = sub.get("rationale") or ""
			ss_sources = sub.get("sources") or []
			n_src = _clamp_count(len(ss_sources), sources_min, sources_max)
			out_subs.append({
				"label": ss_label,
				"rationale": ss_rat,
				"sources": ss_sources[:n_src],
			})
		# Also clamp top-level theme sources to a small number for compactness (optional)
		n_theme_src = _clamp_count(len(sources), sources_min, max(sources_min, min(sources_max, 6)))
		output["themes"].append({
			"label": label,
			"rationale": rationale,
			"sources": sources[:n_theme_src],
			"subthemes": out_subs,
		})

	# Write out
	os.makedirs(os.path.dirname(out_file) or ".", exist_ok=True)
	with open(out_file, "w") as f:
		_json.dump(output, f, indent=2)
	console.print(f"[green]Wrote {out_file}")
