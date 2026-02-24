"""
synthesize.py — generate theme cards per stim day and save to Supabase.

For each cycle day 1-7+:
  1. Embed a day-specific query
  2. Retrieve top 15 most relevant post chunks from Supabase
  3. Ask Claude to synthesize into 3-4 theme cards
  4. Upsert cards to day_insights table

Run after embed.py:
    python3 synthesize.py

Safe to re-run — upserts overwrite existing cards.
"""

import json
import os
import time
import anthropic
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client

load_dotenv()

openai_client    = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
claude_client    = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
supabase         = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

EMBED_MODEL = "text-embedding-3-small"
CLAUDE_MODEL = "claude-haiku-4-5-20251001"
MATCH_COUNT = 15

# Query string used to find relevant posts for each day
DAY_QUERIES = {
    1: "first day of stim injections egg freezing IVF starting protocol how I felt",
    2: "day 2 stimulation injections side effects bloating mood anxiety",
    3: "day 3 stims follicle growth monitoring appointment bloodwork estradiol",
    4: "day 4 stimulation follicles growing estrogen levels ultrasound results",
    5: "day 5 stims mid cycle monitoring follicle sizes estradiol rising",
    6: "day 6 stimulation follicles almost ready trigger shot timing",
    7: "day 7 and beyond late stims trigger shot retrieval day egg freezing results",
}

SYNTHESIS_PROMPT = """You are summarizing real Reddit posts from r/IVF, r/eggfreezing, and r/fertility for someone currently on Day {day} of their egg freezing stimulation cycle.

Here are {count} relevant excerpts from real community posts:

{posts}

Synthesize these into exactly 3 theme cards. Each card captures a real pattern, emotion, or piece of wisdom from the community.

Rules:
- Warm, personal tone — like a friend sharing what others went through, NOT clinical
- Each card must be grounded in the actual posts above (no making things up)
- Titles should be short and relatable (5-8 words max)
- Body should be 2-3 sentences
- Include 1-2 direct quote fragments (partial quotes, not full sentences) where they add authenticity
- No bullet points inside cards — flowing prose only

Return a JSON array of exactly 3 objects, each with:
  "title": string
  "body": string
  "source_count": integer (how many of the posts informed this card)

Return ONLY the JSON array, no other text."""


def embed_query(text: str) -> list[float]:
    resp = openai_client.embeddings.create(model=EMBED_MODEL, input=[text])
    return resp.data[0].embedding


def fetch_relevant_posts(day: int) -> list[dict]:
    query = DAY_QUERIES[day]
    embedding = embed_query(query)

    result = supabase.rpc("match_posts", {
        "query_embedding": embedding,
        "match_count": MATCH_COUNT,
    }).execute()

    return result.data


def synthesize_cards(day: int, posts: list[dict]) -> list[dict]:
    post_text = "\n\n---\n\n".join(
        f"[r/{p['subreddit']}] {p['title']}\n{p['chunk_text']}"
        for p in posts
    )

    prompt = SYNTHESIS_PROMPT.format(
        day=f"Day {day}" if day < 7 else "Day 7+",
        count=len(posts),
        posts=post_text,
    )

    message = claude_client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    # Strip markdown code fences if present
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def run():
    print("Generating theme cards for Days 1–7+...\n")

    for day in range(1, 8):
        label = f"Day {day}" if day < 7 else "Day 7+"
        print(f"  {label}...")

        posts = fetch_relevant_posts(day)
        if not posts:
            print(f"    No posts found, skipping.")
            continue

        cards = synthesize_cards(day, posts)

        supabase.table("day_insights").upsert(
            {"cycle_day": day, "cards": cards},
            on_conflict="cycle_day",
        ).execute()

        print(f"    {len(cards)} cards saved (from {len(posts)} posts)")
        time.sleep(1)  # be polite to APIs

    print("\nDone. All day insights saved to Supabase.")


if __name__ == "__main__":
    run()
