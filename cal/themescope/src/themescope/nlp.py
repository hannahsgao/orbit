import re
from typing import List

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF
from typing import List, Sequence


def normalize_text(text: str) -> str:
	text = text or ""
	text = text.lower()
	text = re.sub(r"https?://[^\s]+", " ", text)
	text = re.sub(r"[^a-z0-9\s]+", " ", text)
	text = re.sub(r"\s+", " ", text).strip()
	return text


def extract_topics(texts: List[str], n_topics: int = 10, min_df: int = 3):
	vectorizer = TfidfVectorizer(max_features=5000, stop_words="english", min_df=min_df)
	X = vectorizer.fit_transform(texts)
	if X.shape[0] == 0 or X.shape[1] == 0:
		return [], None, None
	n_topics = min(n_topics, max(2, min(X.shape)))
	model = NMF(n_components=n_topics, init="nndsvd", random_state=42)
	W = model.fit_transform(X)  # documents x topics
	H = model.components_       # topics x terms
	terms = np.array(vectorizer.get_feature_names_out())
	return (model, W, H, terms)


def top_terms_per_topic(H, terms, top_k=10):
	tops = []
	for topic_idx in range(H.shape[0]):
		idx = np.argsort(H[topic_idx])[::-1][:top_k]
		tops.append(terms[idx].tolist())
	return tops


def _row_normalize(mat: np.ndarray) -> np.ndarray:
	# L2 normalize rows; avoid division by zero
	norms = np.linalg.norm(mat, axis=1, keepdims=True)
	norms[norms == 0.0] = 1.0
	return mat / norms


def cosine_sim_matrix(H: np.ndarray) -> np.ndarray:
	Hn = _row_normalize(H)
	return Hn @ Hn.T


def jaccard(a: Sequence[str], b: Sequence[str]) -> float:
	sa, sb = set(a), set(b)
	if not sa and not sb:
		return 0.0
	return len(sa & sb) / max(1, len(sa | sb))


def select_diverse_topic_indices(H: np.ndarray,
		counts: np.ndarray,
		desired_k: int = 6,
		lambda_diversity: float = 0.7,
		top_terms: List[List[str]] | None = None,
		jaccard_threshold: float = 0.6) -> List[int]:
	"""Greedy selection balancing prevalence (counts) and diversity (cosine).

	- Start with most prevalent topic
	- Iteratively add topic maximizing: lambda * norm_count - (1-lambda) * max_sim_to_selected
	- If top-term Jaccard similarity exceeds threshold with any selected, skip
	"""
	T = H.shape[0]
	if T == 0:
		return []
	S = []
	counts = counts.astype(float)
	if counts.sum() == 0:
		counts = np.ones_like(counts)
	norm_counts = counts / counts.sum()
	Sim = cosine_sim_matrix(H)

	first = int(np.argmax(counts))
	S.append(first)
	while len(S) < min(desired_k, T):
		best_idx = None
		best_score = -1e9
		for t in range(T):
			if t in S:
				continue
			max_sim = float(np.max(Sim[t, S])) if S else 0.0
			score = lambda_diversity * norm_counts[t] - (1.0 - lambda_diversity) * max_sim
			# Penalize near-duplicates by top-term Jaccard
			if top_terms is not None:
				dup_like = any(jaccard(top_terms[t], top_terms[s]) >= jaccard_threshold for s in S)
				if dup_like:
					score -= 10.0
			if score > best_score:
				best_score = score
				best_idx = t
		if best_idx is None:
			break
		S.append(int(best_idx))
	return S
