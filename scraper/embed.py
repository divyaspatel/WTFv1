"""
embed.py — chunk posts, generate embeddings, upsert to Supabase.

Run after scraper.py:
    python3 embed.py

Uses OpenAI text-embedding-3-small (1536 dims, cheapest + fast).
Skips posts already in the DB (idempotent — safe to re-run).
"""

import json
import os
import time
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client

load_dotenv()

openai   = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

CHUNK_SIZE    = 500   # words per chunk
CHUNK_OVERLAP = 50    # words overlap between chunks
BATCH_SIZE    = 100   # posts to embed per OpenAI call
MODEL         = "text-embedding-3-small"


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    words = text.split()
    if len(words) <= size:
        return [text]
    chunks = []
    start = 0
    while start < len(words):
        end = start + size
        chunks.append(" ".join(words[start:end]))
        start += size - overlap
    return chunks


def embed_batch(texts: list[str]) -> list[list[float]]:
    resp = openai.embeddings.create(model=MODEL, input=texts)
    return [item.embedding for item in resp.data]


def already_embedded(post_id: str) -> bool:
    result = supabase.table("posts").select("id").eq("id", post_id + "_0").execute()
    return len(result.data) > 0


def run():
    with open("posts.json") as f:
        posts = json.load(f)

    print(f"Loaded {len(posts)} posts from posts.json")

    # Build all rows to upsert (skip already embedded)
    rows_to_upsert = []
    skipped = 0

    for post in posts:
        if already_embedded(post["id"]):
            skipped += 1
            continue

        chunks = chunk_text(f"{post['title']}\n\n{post['text']}")
        for i, chunk in enumerate(chunks):
            rows_to_upsert.append({
                "post":        post,
                "chunk_index": i,
                "chunk_text":  chunk,
                "row_id":      f"{post['id']}_{i}",
            })

    print(f"Skipping {skipped} already-embedded posts")
    print(f"Embedding {len(rows_to_upsert)} chunks across {len(posts) - skipped} new posts...")

    if not rows_to_upsert:
        print("Nothing to do.")
        return

    # Embed in batches
    for batch_start in range(0, len(rows_to_upsert), BATCH_SIZE):
        batch = rows_to_upsert[batch_start:batch_start + BATCH_SIZE]
        texts = [r["chunk_text"] for r in batch]

        embeddings = embed_batch(texts)

        records = []
        for row, embedding in zip(batch, embeddings):
            p = row["post"]
            records.append({
                "id":          row["row_id"],
                "subreddit":   p["subreddit"],
                "title":       p["title"],
                "text":        p["text"],
                "url":         p["url"],
                "score":       p.get("score"),
                "created_at":  p.get("created_at"),
                "scraped_at":  p.get("scraped_at"),
                "chunk_index": row["chunk_index"],
                "chunk_text":  row["chunk_text"],
                "embedding":   embedding,
            })

        supabase.table("posts").upsert(records).execute()

        done = min(batch_start + BATCH_SIZE, len(rows_to_upsert))
        print(f"  {done}/{len(rows_to_upsert)} chunks embedded & saved")
        time.sleep(0.5)

    print("\nDone.")


if __name__ == "__main__":
    run()
