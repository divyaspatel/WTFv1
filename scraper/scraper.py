"""
Reddit scraper — old.reddit.com, no API key.

Uses the system `curl` binary for HTTP (bypasses Python TLS fingerprinting
that Reddit/Cloudflare blocks) and parses JSON in Python.
"""

import json
import subprocess
import time
from datetime import datetime, timezone

SUBREDDITS = ["IVF", "eggfreezing", "fertility"]

KEYWORDS = [
    "egg freezing", "egg retrieval", "stimulation", "stims",
    "follicle", "gonal", "menopur", "cetrotide", "trigger shot",
    "bloating", "injections", "estradiol", "monitoring", "retrieval day",
]

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

MAX_POSTS_PER_SUB   = 500
DELAY_BETWEEN_PAGES = 2   # seconds — be polite to Reddit
DELAY_BETWEEN_SUBS  = 3   # seconds


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def is_relevant(text: str) -> bool:
    tl = text.lower()
    return any(kw in tl for kw in KEYWORDS)


def curl_get(url: str, params: dict) -> dict:
    """Fetch a URL with curl and return parsed JSON, or raise on failure."""
    query = "&".join(f"{k}={v}" for k, v in params.items())
    full_url = f"{url}?{query}"

    result = subprocess.run(
        ["curl", "-s", "-A", USER_AGENT, full_url],
        capture_output=True,
        text=True,
        timeout=20,
    )

    if result.returncode != 0:
        raise RuntimeError(f"curl failed (exit {result.returncode}): {result.stderr.strip()}")

    body = result.stdout.strip()
    if not body:
        raise RuntimeError("curl returned an empty response")

    return json.loads(body)


# ---------------------------------------------------------------------------
# Core scraper
# ---------------------------------------------------------------------------

def fetch_posts(subreddit: str, limit: int = MAX_POSTS_PER_SUB) -> list[dict]:
    posts: list[dict] = []
    after: str | None = None
    base_url = f"https://old.reddit.com/r/{subreddit}/new.json"

    while len(posts) < limit:
        params: dict = {"limit": 100, "raw_json": 1}
        if after:
            params["after"] = after

        try:
            data = curl_get(base_url, params)
        except (RuntimeError, json.JSONDecodeError) as exc:
            print(f"  Error on r/{subreddit}: {exc}")
            break

        children = data.get("data", {}).get("children", [])
        if not children:
            break

        for child in children:
            p        = child.get("data", {})
            title    = p.get("title", "")
            selftext = p.get("selftext", "")

            if not is_relevant(f"{title} {selftext}"):
                continue
            if len(selftext) < 100:
                continue

            posts.append({
                "id":         p.get("id"),
                "subreddit":  subreddit,
                "title":      title,
                "text":       selftext,
                "url":        f"https://reddit.com{p.get('permalink', '')}",
                "score":      p.get("score"),
                "created_at": datetime.fromtimestamp(
                                  p.get("created_utc", 0), tz=timezone.utc
                              ).isoformat(),
                "scraped_at": datetime.now(tz=timezone.utc).isoformat(),
            })

        after = data.get("data", {}).get("after")
        if not after:
            break  # no more pages

        time.sleep(DELAY_BETWEEN_PAGES)

    return posts


def scrape():
    all_posts: list[dict] = []

    for subreddit in SUBREDDITS:
        print(f"Scraping r/{subreddit}...")
        posts = fetch_posts(subreddit)
        all_posts.extend(posts)
        print(f"  {len(posts)} relevant posts collected")
        time.sleep(DELAY_BETWEEN_SUBS)

    with open("posts.json", "w") as f:
        json.dump(all_posts, f, indent=2)

    print(f"\nDone. Saved {len(all_posts)} posts to posts.json")


if __name__ == "__main__":
    scrape()
