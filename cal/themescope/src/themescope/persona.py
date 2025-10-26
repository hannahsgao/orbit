import numpy as np
from typing import List, Dict, Any, Optional


def embed_texts(texts: List[str], model_name: str = "all-MiniLM-L6-v2"):
	from sentence_transformers import SentenceTransformer
	model = SentenceTransformer(model_name)
	emb = model.encode(texts, batch_size=64, show_progress_bar=False, normalize_embeddings=True)
	return np.asarray(emb, dtype=np.float32)


def kmeans(X: np.ndarray, k: int, seed: int = 42, iters: int = 50):
	# Simple kmeans for small-ish X
	rng = np.random.default_rng(seed)
	idx = rng.choice(X.shape[0], size=min(k, X.shape[0]), replace=False)
	C = X[idx].copy()
	for _ in range(iters):
		dots = X @ C.T  # cosine if normalized
		assign = np.argmax(dots, axis=1)
		newC = []
		for j in range(C.shape[0]):
			pts = X[assign == j]
			if len(pts) == 0:
				newC.append(C[j])
			else:
				c = pts.mean(axis=0)
				norm = np.linalg.norm(c)
				newC.append(c / (norm + 1e-9))
		C = np.vstack(newC)
	return assign, C


def cluster_texts(texts: List[str], k: int = 8, model_name: str = "all-MiniLM-L6-v2"):
	X = embed_texts(texts, model_name=model_name)
	assign, centers = kmeans(X, k)
	return assign, centers


def summarize_cluster(texts: List[str], max_items: int = 50) -> str:
	# Lightweight heuristic summary: top unigrams/bigrams
	from collections import Counter
	import re
	clean = []
	for t in texts[:max_items]:
		s = re.sub(r"https?://\S+", " ", t.lower())
		s = re.sub(r"[^a-z0-9\s]", " ", s)
		s = re.sub(r"\s+", " ", s)
		clean.append(s)
	words = " ".join(clean).split()
	cnt = Counter(words)
	common = [w for w, _ in cnt.most_common(8)]
	return ", ".join(common)


def llm_label_cluster(texts: List[str], client, model: str = "gpt-4o-mini") -> str:
	prompt = (
		"You are labeling a browsing-history cluster. "
		"Return a short, high-signal theme label of 1-3 words focusing on interests/values.\n"
		"Examples: 'deep learning research', 'moral philosophy', 'indie game design'.\n"
		"Items:\n" + "\n".join(f"- {t[:200]}" for t in texts[:50])
	)
	resp = client.chat.completions.create(model=model, messages=[{"role":"user", "content": prompt}], temperature=0.2)
	return resp.choices[0].message.content.strip()


def llm_persona_from_titles(titles: List[str], client, model: str = "gpt-4o-mini") -> str:
	"""Ask LLM to filter logistics, cluster interests/values, and return distinct core themes.

	Returns markdown summarizing 5-8 core themes with short rationales and representative items.
	"""
	preamble = (
		"You are analyzing a person's web browsing titles to infer core interests/values.\n"
		"Instructions:\n"
		"- Filter out logistics (auth, email, calendar, docs, shipping, banking, ecommerce carts).\n"
		"- Cluster remaining items into 5-8 distinct, high-level themes that reveal personality/values.\n"
		"- Prefer diverse, non-overlapping areas (e.g., deep learning research, moral philosophy, indie game design).\n"
		"- For each theme, output: name (1-3 words), 1-2 sentence rationale, and 5 representative items.\n"
		"- Output as Markdown with headings '## Theme: <name>'.\n"
	)
	items = "\n".join(f"- {t[:200]}" for t in titles)
	prompt = preamble + "\nItems:\n" + items
	resp = client.chat.completions.create(
		model=model,
		messages=[{"role": "user", "content": prompt}],
		temperature=0.2,
	)
	return resp.choices[0].message.content.strip()


def llm_persona_json(titles: List[str], client, model: str = "gpt-4o-mini") -> dict:
	"""Ask LLM to return JSON-only core themes with sources.

	Schema:
	{
	  "themes": [
	    {"label": str, "rationale": str, "sources": [{"title": str, "url": str}]} , ...
	  ]
	}
	"""
	import json as _json
	preamble = (
		"You analyze a person's web browsing titles to infer core interests/values.\n"
		"Output STRICT JSON ONLY in this schema: {\"themes\":[{\"label\":str,\"rationale\":str,\"sources\":[{\"title\":str,\"url\":str}]}]}\n"
		"Rules: no markdown, no prose outside JSON. 5-8 distinct themes.\n"
		"Filter out logistics (auth, email, calendar, docs, shipping, banking, carts).\n"
		"Constraint: label must be 1-3 words.\n"
	)
	items = "\n".join(f"- {t[:200]}" for t in titles)
	prompt = preamble + "Items:\n" + items
	resp = client.chat.completions.create(
		model=model,
		messages=[{"role": "user", "content": prompt}],
		temperature=0.2,
	)
	content = resp.choices[0].message.content.strip()
	try:
		return _json.loads(content)
	except Exception:
		# Fallback: wrap as text if not JSON
		return {"themes_text": content}


def semantic_filter(texts: List[str], query: str, model_name: str = "all-MiniLM-L6-v2", top_n: int = 800) -> List[int]:
    from sentence_transformers import SentenceTransformer
    import numpy as _np
    model = SentenceTransformer(model_name)
    # Encode query once
    q = model.encode([query], normalize_embeddings=True)
    # Batch encode texts to reduce latency and memory
    batch = 256
    scores = []
    for i in range(0, len(texts), batch):
        X = model.encode(texts[i:i+batch], batch_size=64, show_progress_bar=False, normalize_embeddings=True)
        sims = (X @ q.T).ravel()
        scores.append(sims)
    sims_all = _np.concatenate(scores) if scores else _np.array([])
    idx = sims_all.argsort()[::-1][: min(top_n, len(texts))]
    return idx.tolist()


def llm_subthemes_from_titles(prompt: str, titles_and_urls: List[str], client, model: str = "gpt-4o-mini") -> str:
	"""Ask LLM to group relevant items into subthemes with sources shown."""
	preamble = (
		"You are analyzing browsing items to create subthemes inside a given theme.\n"
		"Instructions:\n"
		"- Consider only items relevant to the user's theme/prompt.\n"
		"- Group into 5-10 distinct subthemes with clear, non-overlapping categories.\n"
		"- For each subtheme, output: a short label (1-3 words), 1-2 sentence rationale, and 5-8 representative source links/titles.\n"
		"- Output Markdown with headings '## Subtheme: <name>'.\n"
	)
	items = "\n".join(f"- {t[:300]}" for t in titles_and_urls)
	prompt_txt = preamble + f"\nUser theme/prompt: {prompt}\n\nItems:\n" + items
	resp = client.chat.completions.create(
		model=model,
		messages=[{"role": "user", "content": prompt_txt}],
		temperature=0.2,
	)
	return resp.choices[0].message.content.strip()


def llm_subthemes_json(prompt: str, titles_and_urls: List[str], client, model: str = "gpt-4o-mini") -> dict:
	"""Return JSON-only subthemes grouped under a prompt.

	Schema:
	{
	  "subthemes": [
	    {"label": str, "rationale": str, "sources": [{"title": str, "url": str}]} , ...
	  ]
	}
	"""
	import json as _json
	preamble = (
		"Group these browsing items into 5-10 distinct subthemes under the user's theme.\n"
		"Output STRICT JSON ONLY: {\"subthemes\":[{\"label\":str,\"rationale\":str,\"sources\":[{\"title\":str,\"url\":str}]}]}\n"
		"No markdown, no commentary.\n"
		"Constraint: label must be 1-3 words.\n"
	)
	items = "\n".join(f"- {t[:300]}" for t in titles_and_urls)
	prompt_txt = preamble + f"User theme/prompt: {prompt}\nItems:\n" + items
	resp = client.chat.completions.create(
		model=model,
		messages=[{"role": "user", "content": prompt_txt}],
		temperature=0.2,
	)
	content = resp.choices[0].message.content.strip()
	try:
		return _json.loads(content)
	except Exception:
		return {"subthemes_text": content}


