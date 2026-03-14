"""
extract.py — Stage 2: Step Extraction + Scoring

Reads posts_classified.json, filters to complete_journey and partial_journey
posts, and for each one asks Claude Sonnet (with extended thinking) to extract
an ordered sequence of steps and score each one.

Output schema per step:
  step_number, step, step_category, timing, useful_to_outcome,
  order_dependencies, importance, author_would_recommend,
  author_sentiment, author_notes, extraction_confidence

Saves results to journeys_extracted.json.

Run after classify.py:
    python3 extract.py

Safe to re-run — resumes from where it left off.
"""

import argparse
import json
import os
import time
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

MODEL = "claude-sonnet-4-20250514"

USABLE_CLASSES = {"complete_journey", "partial_journey"}

STEP_CATEGORIES = {
    "diagnostics",
    "consultation",
    "medication",
    "procedure",
    "admin",
    "emotional",
}

EXTRACT_PROMPT = """You are extracting a structured journey map from a Reddit post written by someone who went through egg freezing or IVF.

Your job: identify every meaningful step the author took, in the order they took them, score each step, and flag genuine decision points.

POST TITLE: {title}
SOURCE: r/{subreddit}
URL: {url}

POST TEXT:
{text}

Extract every step the author took. Be specific — use their actual words and details where possible. Include emotional steps (e.g. "decided to stop second-guessing and commit") as well as clinical ones.

For each step, produce a JSON object with these exact fields:
{{
  "step_number": <integer, starting at 1>,
  "step": "<clear description of what they did, 1-2 sentences>",
  "step_category": "<one of: diagnostics | consultation | medication | procedure | admin | emotional | financial>",
  "timing": "<when in the journey this occurred, e.g. 'before starting', 'day 3 of stims', 'after retrieval'>",
  "useful_to_outcome": <float 0.0-1.0, how much this step contributed to a positive outcome based on author's account>,
  "order_dependencies": [<list of step numbers that must precede this one, or empty list>],
  "importance": "<critical | recommended | optional>",
  "author_would_recommend": <true | false | null if unclear>,
  "author_sentiment": "<positive | negative | mixed | neutral>",
  "author_notes": "<direct insight or partial quote from the author about this step, max 100 chars>",
  "extraction_confidence": <float 0.0-1.0, how confident you are this step was clearly described vs. inferred>,
  "is_decision_point": <true if the author explicitly described choosing between alternatives at this step, false otherwise>,
  "alternatives_considered": <list of strings describing the options they weighed, or null if not a decision point>,
  "author_chose": "<what they actually chose, or null if not a decision point>",
  "author_reasoning": "<why they chose it, in their words, or null — only populate from explicit text, never infer>"
}}

A step is a decision point when the author:
- Explicitly weighed two or more options ("I decided to freeze embryos instead of eggs because...")
- Described a fork in the road with their RE or on their own
- Expressed they wish they had chosen differently (signals the alternative was real)
- Used language like "I went with X over Y", "my RE gave me two options", "I wasn't sure whether to"

Rules:
- Only extract steps explicitly mentioned or clearly implied by the post — do NOT invent steps
- Steps must be in chronological order as the author narrated them
- Minimum 3 steps, maximum 15 steps per post
- is_decision_point must be true only when alternatives were genuinely described — not every step is a decision
- alternatives_considered and author_reasoning must come from the post text — do not infer or fabricate
- extraction_confidence should be < 0.7 if you had to infer the step

Respond with ONLY a JSON array of step objects. No other text."""


def extract_steps(post: dict) -> list[dict] | None:
    """Extract steps from a single post. Returns list of step dicts, or None on failure."""
    text = post.get("text", "")
    # Keep up to 6000 chars — Sonnet can handle it and journey posts are often long
    if len(text) > 6000:
        text = text[:6000] + "\n[truncated]"

    prompt = EXTRACT_PROMPT.format(
        title=post["title"],
        subreddit=post["subreddit"],
        url=post.get("url", ""),
        text=text,
    )

    for attempt in range(3):
        try:
            msg = client.messages.create(
                model=MODEL,
                max_tokens=8000,
                thinking={
                    "type": "enabled",
                    "budget_tokens": 5000,
                },
                messages=[{"role": "user", "content": prompt}],
            )

            # Find the text block (skip thinking blocks)
            raw = None
            for block in msg.content:
                if block.type == "text":
                    raw = block.text.strip()
                    break

            if not raw:
                raise ValueError("No text block in response")

            # Strip markdown fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]

            steps = json.loads(raw.strip())

            # Basic validation
            if not isinstance(steps, list) or len(steps) < 1:
                raise ValueError(f"Expected list, got {type(steps)}")

            return steps

        except (json.JSONDecodeError, ValueError, KeyError) as e:
            if attempt == 2:
                print(f"    Extraction failed after 3 attempts: {e}")
                return None
            print(f"    Parse error, retrying ({attempt + 1}/3)...")
            time.sleep(3)


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="posts_classified.json",
                        help="Input file (default: posts_classified.json)")
    parser.add_argument("--output", default="journeys_extracted.json",
                        help="Output file (default: journeys_extracted.json)")
    args = parser.parse_args()

    # Load classified posts
    try:
        with open(args.input) as f:
            all_posts = json.load(f)
    except FileNotFoundError:
        print(f"{args.input} not found. Run classify.py (or fetch_seed_posts.py) first.")
        return

    journey_posts = [p for p in all_posts if p.get("journey_class") in USABLE_CLASSES]
    print(f"Loaded {len(journey_posts)} journey posts (complete + partial)\n")

    # Load existing extracted results to allow resuming
    try:
        with open(args.output) as f:
            extracted = json.load(f)
        done_ids = {e["post_id"] for e in extracted}
        print(f"Resuming — {len(extracted)} already extracted, {len(journey_posts) - len(done_ids)} remaining\n")
    except FileNotFoundError:
        extracted = []
        done_ids = set()

    failed = 0

    for i, post in enumerate(journey_posts):
        if post["id"] in done_ids:
            continue

        print(f"  [{i+1}/{len(journey_posts)}] Extracting: {post['title'][:65]}")

        steps = extract_steps(post)

        if steps is None:
            failed += 1
            print(f"    ❌ Failed — skipping")
        else:
            avg_confidence = sum(s.get("extraction_confidence", 0) for s in steps) / len(steps)
            print(f"    ✅ {len(steps)} steps extracted (avg confidence: {avg_confidence:.2f})")

            extracted.append({
                "post_id": post["id"],
                "post_title": post["title"],
                "subreddit": post["subreddit"],
                "url": post.get("url", ""),
                "journey_class": post["journey_class"],
                "steps": steps,
            })

        done_ids.add(post["id"])

        # Save checkpoint every 10 posts
        if (i + 1) % 10 == 0:
            with open(args.output, "w") as f:
                json.dump(extracted, f, indent=2)
            print(f"\n  Checkpoint saved — {len(extracted)} journeys extracted so far\n")

        time.sleep(1)  # extended thinking calls can be slow

    # Final save
    with open(args.output, "w") as f:
        json.dump(extracted, f, indent=2)

    total_steps = sum(len(e["steps"]) for e in extracted)
    avg_steps = total_steps / len(extracted) if extracted else 0

    print(f"\n{'='*50}")
    print(f"Extraction complete")
    print(f"  Journeys extracted: {len(extracted)}")
    print(f"  Failed: {failed}")
    print(f"  Total steps extracted: {total_steps}")
    print(f"  Avg steps per journey: {avg_steps:.1f}")
    print(f"Saved to {args.output}")


if __name__ == "__main__":
    run()
