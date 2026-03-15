"""
analyze_non_journey.py — Three parallel analyses on non-journey posts.

1. QUESTIONS (question_only): ranked by frequency + importance
2. EMOTIONS (single_moment): emotions + what women are seeking from community
3. MED DONATIONS (reaction_only): actionable donor list

Outputs:
  questions_ranked.json
  emotions_analysis.json
  med_donations.json

Run:
    python3 analyze_non_journey.py
"""

import json
import os
import anthropic
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

load_dotenv()
client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

MODEL = "claude-sonnet-4-20250514"

# ── Load posts ──────────────────────────────────────────────────────────────

data = json.load(open("posts_classified.json"))
questions   = [p for p in data if p["journey_class"] == "question_only"]
moments     = [p for p in data if p["journey_class"] == "single_moment"]
donations   = [p for p in data if p["journey_class"] == "reaction_only"]

print(f"Loaded: {len(questions)} questions, {len(moments)} single moments, {len(donations)} donations\n")


# ── Analysis 1: Questions ranked by frequency + importance ──────────────────

def build_question_text(posts):
    lines = []
    for p in posts:
        text = p.get("text", "")[:300].strip()
        lines.append(f"TITLE: {p['title']}\nTEXT: {text}\n")
    return "\n---\n".join(lines)

QUESTIONS_PROMPT = """You are analyzing {count} Reddit posts from women on fertility forums (r/IVF, r/eggfreezing, r/fertility).
Each post is a question these women are asking.

Here are all the posts:

{posts}

Your job:
1. Identify the recurring question themes — cluster similar questions together
2. Rank them by (a) how frequently the theme appears AND (b) how emotionally important / high-stakes it seems
3. For each theme, capture the specific sub-questions women ask

Return a JSON array of question themes, sorted from most to least frequent+important:
[
  {{
    "rank": 1,
    "theme": "<short theme name, 4-6 words>",
    "question_count": <how many posts map to this theme>,
    "frequency_pct": <% of question posts this theme covers>,
    "importance": "<critical | high | medium | low>",
    "why_important": "<1 sentence — why does this question matter to these women>",
    "example_questions": ["<3-5 verbatim or paraphrased questions from the posts>"],
    "journey_stage": "<when in the journey women typically ask this: pre-consultation | diagnostics | protocol | stims | retrieval | transfer | TWW | results | general>"
  }}
]

Return ONLY the JSON array. No other text."""


# ── Analysis 2: Emotions + what women need ──────────────────────────────────

def build_moments_text(posts):
    lines = []
    for p in posts:
        text = p.get("text", "")[:400].strip()
        lines.append(f"TITLE: {p['title']}\nTEXT: {text}\n")
    return "\n---\n".join(lines)

EMOTIONS_PROMPT = """You are analyzing {count} Reddit posts from women going through fertility treatments.
Each post captures a single emotional moment — not a full journey, just one feeling or experience.

Here are all the posts:

{posts}

Your job:
1. Identify the recurring emotional themes
2. For each theme, identify what these women are actually seeking from the Reddit community when they post
3. Rank by frequency

Return a JSON array:
[
  {{
    "rank": 1,
    "emotion": "<primary emotion, e.g. 'fear', 'grief', 'anxiety', 'hope', 'frustration'>",
    "trigger": "<what typically triggers this emotion, e.g. 'poor scan results', 'failed transfer'>",
    "post_count": <number of posts with this emotion>,
    "frequency_pct": <% of single_moment posts>,
    "what_they_need": "<what these women are actually looking for when they post — validation, advice, shared experience, hope, practical help>",
    "what_would_help": "<1-2 sentences — what kind of response or content would genuinely help them>",
    "example_posts": ["<2-3 representative post titles>"],
    "journey_stage": "<when this emotion typically hits>"
  }}
]

Return ONLY the JSON array. No other text."""


# ── Analysis 3: Medication donation actionable list ──────────────────────────

def build_donations_text(posts):
    lines = []
    for p in posts:
        text = p.get("text", "")[:500].strip()
        lines.append(f"TITLE: {p['title']}\nURL: {p.get('url','')}\nTEXT: {text}\n")
    return "\n---\n".join(lines)

DONATIONS_PROMPT = """You are extracting actionable medication donation listings from Reddit posts.

Here are all the posts:

{posts}

For each post that contains a real medication donation offer, extract:
- Who is offering (anonymous Reddit user)
- What medications (name, quantity if mentioned)
- Where (city, neighborhood if mentioned)
- How to get it (pickup only, willing to ship, contact method if mentioned)
- URL of the post

Return a JSON array, one object per donation listing:
[
  {{
    "medications": ["<medication name and quantity>"],
    "location": "<city and neighborhood if given>",
    "pickup_or_ship": "<pickup | ship | both | unknown>",
    "notes": "<any other relevant details — expiry, contact preference, etc.>",
    "post_url": "<url>",
    "post_title": "<title>"
  }}
]

Only include posts that are genuine offers of unused medications.
Return ONLY the JSON array. No other text."""


# ── Run all three in parallel ────────────────────────────────────────────────

def run_analysis(name, prompt, posts, batch_size=150):
    """Run analysis, batching if needed and merging results."""
    print(f"  Starting {name} analysis ({len(posts)} posts)...")

    if len(posts) <= batch_size:
        batches = [posts]
    else:
        batches = [posts[i:i+batch_size] for i in range(0, len(posts), batch_size)]

    all_results = []

    for i, batch in enumerate(batches):
        if name == "questions":
            text = build_question_text(batch)
            filled = prompt.format(count=len(batch), posts=text)
        elif name == "emotions":
            text = build_moments_text(batch)
            filled = prompt.format(count=len(batch), posts=text)
        else:
            text = build_donations_text(batch)
            filled = prompt.format(posts=text)

        msg = client.messages.create(
            model=MODEL,
            max_tokens=8000,
            messages=[{"role": "user", "content": filled}],
        )
        raw = msg.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        result = json.loads(raw.strip())
        all_results.extend(result)
        if len(batches) > 1:
            print(f"    {name} batch {i+1}/{len(batches)} done")

    # If multiple batches, do a merge pass
    if len(batches) > 1 and name != "donations":
        print(f"    Merging {name} batches...")
        merge_prompt = f"""Merge and deduplicate these {len(batches)} partial analyses of the same type into one final ranked list.
Combine similar themes, sum counts, re-rank by frequency.
Input: {json.dumps(all_results, indent=2)[:12000]}
Return ONLY a JSON array in the same schema. No other text."""
        msg = client.messages.create(
            model=MODEL,
            max_tokens=8000,
            messages=[{"role": "user", "content": merge_prompt}],
        )
        raw = msg.content[0].text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        all_results = json.loads(raw.strip())

    print(f"  ✅ {name} done — {len(all_results)} items")
    return name, all_results


tasks = [
    ("questions", QUESTIONS_PROMPT, questions),
    ("emotions",  EMOTIONS_PROMPT,  moments),
    ("donations", DONATIONS_PROMPT, donations),
]

results = {}
with ThreadPoolExecutor(max_workers=3) as executor:
    futures = {executor.submit(run_analysis, name, prompt, posts): name
               for name, prompt, posts in tasks}
    for future in as_completed(futures):
        name, result = future.result()
        results[name] = result

# Save outputs
with open("questions_ranked.json", "w") as f:
    json.dump(results["questions"], f, indent=2)

with open("emotions_analysis.json", "w") as f:
    json.dump(results["emotions"], f, indent=2)

with open("med_donations.json", "w") as f:
    json.dump(results["donations"], f, indent=2)

print("\n✅ All three analyses complete.")
print(f"  questions_ranked.json  — {len(results['questions'])} question themes")
print(f"  emotions_analysis.json — {len(results['emotions'])} emotion themes")
print(f"  med_donations.json     — {len(results['donations'])} donation listings")
