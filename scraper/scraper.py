"""
Reddit scraper — old.reddit.com, no API key.

Uses the system `curl` binary for HTTP (bypasses Python TLS fingerprinting
that Reddit/Cloudflare blocks) and parses JSON in Python.
"""

import json
import subprocess
import time
from datetime import datetime, timezone

ANCHOR_SUB  = "eggfreezing"   # scrape all available posts from this one first
OTHER_SUBS  = ["IVF", "fertility", "infertility", "PCOS", "endometriosis"]
TARGET_TOTAL = 2000           # desired total across all subreddits

KEYWORDS = [
    # Existing core
    "egg freezing", "egg retrieval", "stimulation", "stims",
    "follicle", "gonal", "menopur", "cetrotide", "trigger shot",
    "bloating", "injections", "estradiol", "monitoring", "retrieval day",

    # Medications & Protocols
    "ovidrel", "lupron", "leuprolide", "follistim", "puregon", "omnitrope",
    "clomid", "letrozole", "progesterone", "hcg", "antagonist protocol",
    "agonist protocol", "mini ivf", "natural ivf", "microdose lupron",

    # Diagnostics & Labs
    "amh", "afc", "antral follicle count", "fsh", "baseline ultrasound",
    "bloodwork", "ovarian reserve", "diminished ovarian reserve", "dor",
    "poor responder", "low amh",

    # Cycle & Procedure
    "egg freezing cycle", "embryo freezing", "ivf cycle", "egg banking",
    "embryo banking", "oocyte", "mature eggs", "mii eggs", "fertilization rate",
    "blastocyst", "blast", "day 5 embryo", "embryo grading", "pgt-a", "pgt",
    "genetic testing", "normal embryo", "euploid", "aneuploid",

    # Clinic & Process
    "reproductive endocrinologist", "fertility clinic", "fertility specialist",
    "ivf coordinator", "cycle canceled", "poor response", "converted to ivf",
    "freeze all", "egg bank", "sperm donor", "known donor",

    # Symptoms & Side Effects
    "ohss", "ovarian hyperstimulation", "cramping", "mood swings",
    "injection site", "belly bruises", "swollen ovaries", "ovary pain",

    # Emotional / Community Language
    "fertility journey", "trying to conceive", "ttc", "social egg freezing",
    "medical egg freezing", "fertility preservation", "elective freezing",
    "freezing for cancer", "oncofertility", "single mom by choice", "smbc",

    # Cost & Logistics
    "fertility financing", "insurance coverage", "fertility benefits",
    "progyny", "win fertility", "carrot fertility", "out of pocket",
    "shared risk", "refund program", "fertility loan",
]

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

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

def fetch_posts(subreddit: str, limit: int = 1000) -> list[dict]:
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

    # Step 1 — scrape all available posts from the anchor subreddit
    print(f"Scraping r/{ANCHOR_SUB} (anchor — no limit)...")
    anchor_posts = fetch_posts(ANCHOR_SUB, limit=1000)
    all_posts.extend(anchor_posts)
    print(f"  {len(anchor_posts)} relevant posts collected")
    time.sleep(DELAY_BETWEEN_SUBS)

    # Step 2 — divide remaining budget equally among other subreddits
    remaining = max(0, TARGET_TOTAL - len(anchor_posts))
    per_sub   = max(1, remaining // len(OTHER_SUBS))
    print(f"\nr/{ANCHOR_SUB} gave {len(anchor_posts)} posts.")
    print(f"Remaining budget: {remaining} — pulling up to {per_sub} from each of {len(OTHER_SUBS)} other subreddits.\n")

    for subreddit in OTHER_SUBS:
        print(f"Scraping r/{subreddit} (limit {per_sub})...")
        posts = fetch_posts(subreddit, limit=per_sub)
        all_posts.extend(posts)
        print(f"  {len(posts)} relevant posts collected")
        time.sleep(DELAY_BETWEEN_SUBS)

    with open("posts.json", "w") as f:
        json.dump(all_posts, f, indent=2)

    print(f"\nDone. Saved {len(all_posts)} posts to posts.json")
    for sub in [ANCHOR_SUB] + OTHER_SUBS:
        count = sum(1 for p in all_posts if p["subreddit"] == sub)
        print(f"  r/{sub}: {count}")


if __name__ == "__main__":
    scrape()
