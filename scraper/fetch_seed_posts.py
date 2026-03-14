"""
fetch_seed_posts.py — Fetch the 18 hand-picked seed posts from the methodology doc.

These are all known complete-journey posts so they skip Stage 1 classification
and go straight to extract.py.

Output: seed_posts_classified.json (same format as posts_classified.json,
        all pre-labeled as complete_journey)

Run:
    python3 fetch_seed_posts.py
"""

import json
import subprocess
import time
from datetime import datetime, timezone

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

SEED_POSTS = [
    ("eggfreezing", "1247o79",  "A detailed egg freezing experience"),
    ("eggfreezing", "1mycye8",  "From egg freezing to euploid embryos: my experience and results"),
    ("eggfreezing", "1klupxb",  "My (30F) Detailed Egg Freezing Experience in Chicago"),
    ("eggfreezing", "1f2k2rr",  "Egg freezing experience - Spring Fertility NY"),
    ("eggfreezing", "1l989kt",  "Egg Freezing today: My Tips + Results; 35F, Stage 3 Endo"),
    ("eggfreezing", "1r3dl6y",  "33 yo F, AMH 1.2-0.9, married, high stress career, first egg freezing cycle!"),
    ("eggfreezing", "16qi2rp",  "Detailed Egg Freezing Experience (31F, PCOS, High risk OHSS + prevention tips!)"),
    ("eggfreezing", "1ksz4zr",  "33F. Detailed egg freezing cycle with costs"),
    ("eggfreezing", "1r9bho7",  "Embryo Freezing Recap"),
    ("eggfreezing", "1jfxhe2",  "Detailed Egg Freezing Journey - NYC 29F - March 2025 (NYU Langone)"),
    ("eggfreezing", "1f11pg1",  "Yet another NYU fertility egg freezing journal"),
    ("eggfreezing", "1o0o18r",  "Sharing my story: 33F, AMH 1.6, AFC 8"),
    ("eggfreezing", "1abfq1r",  "What's one thing you wish someone told you before freezing your eggs?"),
    ("eggfreezing", "1b29kra",  "Egg Freezing Journey Review (34F)"),
    ("eggfreezing", "15ctlwk",  "Another very detailed egg freezing recap (NYC)"),
    ("eggfreezing", "1mvxoex",  "From egg freezing to euploid: my results"),
    ("IVF",         "1hs7jq7",  "Freezing my eggs at 30 was a total waste"),
    ("IVF",         "mrh8b7",   "My Experience - Embryo Freezing to Preserve Fertility"),
]


def curl_get(url: str) -> dict:
    result = subprocess.run(
        ["curl", "-s", "-A", USER_AGENT, url],
        capture_output=True, text=True, timeout=20,
    )
    if result.returncode != 0:
        raise RuntimeError(f"curl failed: {result.stderr.strip()}")
    body = result.stdout.strip()
    if not body:
        raise RuntimeError("Empty response")
    return json.loads(body)


def fetch_post(subreddit: str, post_id: str, title: str) -> dict | None:
    url = f"https://old.reddit.com/r/{subreddit}/comments/{post_id}.json?raw_json=1"
    try:
        data = curl_get(url)
        # Reddit returns [post_listing, comments_listing]
        post_data = data[0]["data"]["children"][0]["data"]
        text = post_data.get("selftext", "")
        if not text or text == "[removed]" or text == "[deleted]":
            print(f"  ⚠️  No text content — skipping")
            return None

        return {
            "id":              post_data.get("id", post_id),
            "subreddit":       subreddit,
            "title":           post_data.get("title", title),
            "text":            text,
            "url":             f"https://reddit.com{post_data.get('permalink', '')}",
            "score":           post_data.get("score"),
            "created_at":      datetime.fromtimestamp(
                                   post_data.get("created_utc", 0), tz=timezone.utc
                               ).isoformat(),
            "scraped_at":      datetime.now(tz=timezone.utc).isoformat(),
            # Pre-classified — these are all hand-picked complete journeys
            "journey_class":   "complete_journey",
            "class_confidence": 1.0,
            "class_reason":    "Hand-picked seed post from methodology doc",
        }
    except Exception as e:
        print(f"  ❌ Error fetching {post_id}: {e}")
        return None


def run():
    print(f"Fetching {len(SEED_POSTS)} seed posts...\n")
    results = []

    for i, (subreddit, post_id, title) in enumerate(SEED_POSTS):
        print(f"  [{i+1}/{len(SEED_POSTS)}] r/{subreddit} — {title[:60]}")
        post = fetch_post(subreddit, post_id, title)
        if post:
            word_count = len(post["text"].split())
            print(f"    ✅ {word_count} words")
            results.append(post)
        time.sleep(1.5)  # be polite to Reddit

    with open("seed_posts_classified.json", "w") as f:
        json.dump(results, f, indent=2)

    print(f"\nDone. {len(results)}/{len(SEED_POSTS)} posts fetched.")
    print(f"Saved to seed_posts_classified.json")
    print(f"\nNext: python3 extract.py --input seed_posts_classified.json")


if __name__ == "__main__":
    run()
