"""
classify.py — Stage 1: Journey Signal Classifier

Reads posts.json, classifies each post into one of 5 categories using
Claude Haiku (fast, cheap), and saves results to posts_classified.json.

Categories:
  complete_journey  → proceeds to Stage 2 ✅
  partial_journey   → proceeds to Stage 2 ✅
  single_moment     → filtered out ❌
  question_only     → filtered out ❌
  reaction_only     → filtered out ❌

Expected: ~60-70% filtered out, leaving 200-300 usable posts.

Run:
    python3 classify.py

Safe to re-run — overwrites posts_classified.json.
"""

import json
import os
import time
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

MODEL = "claude-haiku-4-5-20251001"

JOURNEY_CLASSES = {
    "complete_journey",
    "partial_journey",
    "single_moment",
    "question_only",
    "reaction_only",
}

USABLE_CLASSES = {"complete_journey", "partial_journey"}

CLASSIFY_PROMPT = """You are classifying Reddit posts from r/IVF, r/eggfreezing, and r/fertility.

Classify the post below into EXACTLY ONE of these categories:

- complete_journey: The author narrates their full experience from start to finish (e.g., deciding to freeze → clinic → stims → retrieval → results). Multi-stage narrative arc.
- partial_journey: The author describes multiple sequential steps or decisions but not the full arc. Still has narrative progression.
- single_moment: The post focuses on one step, one emotion, one decision, or one result only — no sequential narrative.
- question_only: Primarily asking for advice, recommendations, or information. Little or no personal journey data.
- reaction_only: Responding to someone else's post or sharing a reaction without narrating their own journey.

POST TITLE: {title}

POST TEXT:
{text}

Respond with ONLY a JSON object in this exact format:
{{
  "class": "<one of the five categories>",
  "confidence": <0.0-1.0>,
  "reason": "<one sentence explaining why>"
}}"""


def classify_post(post: dict) -> dict:
    """Classify a single post. Returns dict with class, confidence, reason."""
    text = post.get("text", "")
    # Truncate very long posts — Haiku doesn't need the whole thing to classify
    if len(text) > 3000:
        text = text[:3000] + "\n[truncated]"

    prompt = CLASSIFY_PROMPT.format(title=post["title"], text=text)

    for attempt in range(3):
        try:
            msg = client.messages.create(
                model=MODEL,
                max_tokens=256,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = msg.content[0].text.strip()

            # Strip markdown fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]

            result = json.loads(raw.strip())

            # Validate class is one we recognize
            if result.get("class") not in JOURNEY_CLASSES:
                raise ValueError(f"Unknown class: {result.get('class')}")

            return result

        except (json.JSONDecodeError, ValueError, KeyError) as e:
            if attempt == 2:
                print(f"    Classification failed after 3 attempts: {e}")
                return {"class": "single_moment", "confidence": 0.0, "reason": "parse error"}
            time.sleep(2)


def run():
    with open("posts.json") as f:
        posts = json.load(f)

    print(f"Loaded {len(posts)} posts from posts.json\n")

    # Load existing results to allow resuming
    try:
        with open("posts_classified.json") as f:
            classified = json.load(f)
        done_ids = {p["id"] for p in classified}
        print(f"Resuming — {len(classified)} already classified, {len(posts) - len(done_ids)} remaining\n")
    except FileNotFoundError:
        classified = []
        done_ids = set()

    counts = {c: 0 for c in JOURNEY_CLASSES}
    for p in classified:
        cls = p.get("journey_class")
        if cls in counts:
            counts[cls] += 1

    for i, post in enumerate(posts):
        if post["id"] in done_ids:
            continue

        result = classify_post(post)
        cls = result["class"]
        counts[cls] += 1

        classified_post = {
            **post,
            "journey_class": cls,
            "class_confidence": result["confidence"],
            "class_reason": result["reason"],
        }
        classified.append(classified_post)
        done_ids.add(post["id"])

        usable_so_far = sum(counts[c] for c in USABLE_CLASSES)
        total_so_far = len(classified)
        print(
            f"  [{total_so_far}/{len(posts)}] {cls} ({result['confidence']:.2f}) "
            f"— {post['title'][:60]}"
        )

        # Save checkpoint every 25 posts
        if total_so_far % 25 == 0:
            with open("posts_classified.json", "w") as f:
                json.dump(classified, f, indent=2)
            print(f"\n  Checkpoint saved. Usable so far: {usable_so_far}/{total_so_far}\n")

        time.sleep(0.3)  # ~3 req/sec — well within Haiku limits

    # Final save
    with open("posts_classified.json", "w") as f:
        json.dump(classified, f, indent=2)

    # Summary
    total = len(classified)
    usable = sum(counts[c] for c in USABLE_CLASSES)
    print(f"\n{'='*50}")
    print(f"Classification complete — {total} posts processed")
    print(f"\nBreakdown:")
    for cls, count in sorted(counts.items(), key=lambda x: -x[1]):
        marker = "✅" if cls in USABLE_CLASSES else "❌"
        print(f"  {marker} {cls}: {count} ({count/total*100:.1f}%)")
    print(f"\nUsable for Stage 2: {usable} posts ({usable/total*100:.1f}%)")
    print(f"Saved to posts_classified.json")


if __name__ == "__main__":
    run()
