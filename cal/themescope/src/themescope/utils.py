from urllib.parse import urlparse, parse_qs
import hashlib
import re


def extract_domain(url: str) -> str:
	if not url:
		return ""
	parsed = urlparse(url)
	domain = parsed.netloc.lower()
	if domain.startswith("www."):
		domain = domain[4:]
	return domain


def extract_search_query(url: str) -> str:
	if not url:
		return ""
	parsed = urlparse(url)
	qs = parse_qs(parsed.query)
	q = qs.get("q", [""])[0]
	return q


# Heuristic filters for non-thematic/logistical content
EXCLUDED_DOMAINS = {
	"accounts.google.com",
	"mail.google.com",
	"calendar.google.com",
	"drive.google.com",
	"docs.google.com",
	"sheets.google.com",
	"meet.google.com",
	"zoom.us",
	"slack.com",
	"app.slack.com",
	"notion.so",
	"dropbox.com",
	"box.com",
	"okta.com",
	"onelogin.com",
	"microsoftonline.com",
	"login.live.com",
	"apple.com",
	"icloud.com",
	"paypal.com",
	"chase.com",
	"bankofamerica.com",
	"wellsfargo.com",
	"amazon.com",
	"www.amazon.com",
	"ebay.com",
	"bestbuy.com",
	"fedex.com",
	"ups.com",
	"dhl.com",
}

EXCLUDED_KEYWORDS = [
	"login", "sign in", "signin", "signup", "account", "settings", "help",
	"support", "privacy", "terms", "checkout", "cart", "order", "tracking",
	"dashboard", "home", "inbox", "calendar", "drive", "docs", "download",
	"oauth", "sso", "auth", "billing", "receipt"
]

# Interest/value centric keyword buckets
INTEREST_KEYWORDS = {
	"math_ai": [
		"math", "algebra", "calculus", "probability", "statistics", "graph theory",
		"machine learning", "ml", "deep learning", "neural", "transformer",
		"llm", "reinforcement learning", "optimization", "bayesian", "arxiv",
		"pytorch", "tensorflow", "jax", "rag", "vector db", "embedding"
	],
	"philosophy_ethics": [
		"philosophy", "ethics", "morality", "moral", "epistemology",
		"metaphysics", "stoicism", "kant", "nietzsche", "utilitarian",
		"virtue", "deontology", "free will", "consciousness"
	],
	"arts_gaming": [
		"art", "painting", "gallery", "music", "album", "composer", "film",
		"cinema", "photography", "design", "architecture", "theatre", "gaming",
		"video game", "steam", "nintendo", "playstation", "xbox", "indie game"
	],
}


def is_generic_link(url: str, title: str) -> bool:
	domain = extract_domain(url)
	if domain in EXCLUDED_DOMAINS:
		return True
	text = f"{title or ''} {url or ''}".lower()
	return any(k in text for k in EXCLUDED_KEYWORDS)


def interest_score(url: str, title: str) -> int:
	text = f"{title or ''} {url or ''}".lower()
	score = 0
	for bucket in INTEREST_KEYWORDS.values():
		for kw in bucket:
			if kw in text:
				score += 1
	return score


def normalize_url_for_dedup(url: str) -> str:
	"""Canonicalize URL for deduplication: strip query/fragment, collapse www, lower-case domain, trim trailing slashes."""
	if not url:
		return ""
	p = urlparse(url)
	domain = p.netloc.lower()
	if domain.startswith("www."):
		domain = domain[4:]
	path = re.sub(r"/+", "/", p.path or "/")
	if path != "/" and path.endswith("/"):
		path = path[:-1]
	return f"{p.scheme}://{domain}{path}"


def categorize_theme_from_keywords(keywords: list[str]) -> str:
	kw_text = " ".join(keywords).lower()
	for cat, kws in INTEREST_KEYWORDS.items():
		if any(k in kw_text for k in kws):
			return cat
	return "general_interest"


def stable_id(title: str, url: str) -> str:
	"""Stable short id for caching: sha1 of title+url."""
	m = hashlib.sha1()
	m.update((title or "").encode("utf-8"))
	m.update(b"||")
	m.update((url or "").encode("utf-8"))
	return m.hexdigest()



