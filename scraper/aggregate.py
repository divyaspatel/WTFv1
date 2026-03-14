"""
aggregate.py — Stage 3: Clustering + Aggregation

Reads journeys_extracted.json (200-300 structured journey maps) and aggregates
them into a canonical pathway — an ordered sequence of steps with frequency
scores, importance weights, and representative community quotes.

Method:
  1. Feed all extracted steps to Sonnet in batches
  2. Sonnet clusters semantically similar steps (e.g. "got AMH tested",
     "baseline bloodwork", "checked hormone levels" → same node)
  3. Builds canonical pathway ordered by typical sequence + outcome correlation
  4. Saves canonical_pathway.json locally and upserts to Supabase

Run after extract.py:
    python3 aggregate.py

Safe to re-run — overwrites output files.
"""

import argparse
import json
import os
import time
import anthropic
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

MODEL = "claude-sonnet-4-20250514"

# How many journeys to feed per aggregation batch
# (Sonnet context is large, but we chunk to keep prompts focused)
BATCH_SIZE = 50

AGGREGATE_PROMPT = """You are building a canonical egg freezing / IVF journey pathway from {count} real community journey maps extracted from Reddit.

Each journey map contains ordered steps that real people took, including decision points where they explicitly chose between alternatives.

Your job is to:
1. Identify steps that are semantically equivalent across journeys (cluster them)
2. Merge them into canonical step nodes
3. Order the nodes by when they typically occur in the journey
4. Score each node by frequency, importance, and whether it represents a real decision
5. Flag nodes as choices when the underlying data shows women genuinely diverged here

Here are the {count} journey maps:

{journeys}

Produce a canonical pathway — an ordered list of step nodes.

For each node, return:
{{
  "node_id": <integer, 1 = earliest in journey>,
  "title": "<short step title, 4-6 words>",
  "description": "<what this step involves, 2-3 sentences, warm and personal tone>",
  "category": "<diagnostics | consultation | medication | procedure | admin | emotional | financial>",
  "frequency": <float 0.0-1.0, fraction of journeys that included this step>,
  "importance": "<critical | recommended | optional>",
  "typical_timing": "<when in journey this occurs>",
  "avg_useful_to_outcome": <float 0.0-1.0>,
  "would_recommend_rate": <float 0.0-1.0>,
  "is_choice": <true if this step is a genuine fork where women took meaningfully different paths AND at least some source posts flagged it as a decision point>,
  "choice_question": "<if is_choice=true: the question the woman needs to answer at this step, e.g. 'Should I freeze eggs or embryos?' — null otherwise>",
  "options": [
    {{
      "label": "<a specific path people took at this step, 5-10 words>",
      "description": "<what this option involves, 1-2 sentences>",
      "frequency": <float 0.0-1.0, fraction of people at this step who chose this option>,
      "outcome_signal": "<positive | negative | neutral | mixed>",
      "decision_point_rate": <float 0.0-1.0, fraction of source posts that explicitly flagged this as a deliberate choice>
    }}
  ],
  "community_note": "<1-2 sentence insight from the community about this step>",
  "source_post_count": <integer>,
  "decision_point_count": <integer, how many source posts explicitly flagged this step as a decision point>
}}

Rules:
- is_choice should be true only when: (a) options diverge meaningfully in frequency (no single option > 85%), AND (b) at least 2 source posts flagged this step as a decision point
- A step can have options without being a choice — options show how people navigated it, choices flag it as requiring the user's deliberate decision
- Include only steps that appear in at least 3 journeys
- Order nodes chronologically
- Tone: warm, personal — like a well-informed friend
- No invented choices or options — ground everything in source data

Return ONLY a JSON array of node objects. No other text."""


def build_journey_summary(journey: dict) -> str:
    """Compact summary of one extracted journey for the aggregation prompt."""
    lines = [f"JOURNEY: {journey['post_title']} (r/{journey['subreddit']})"]
    for s in journey["steps"]:
        line = (
            f"  Step {s['step_number']}: [{s.get('step_category', '?')}] {s['step']} "
            f"(importance={s.get('importance', '?')}, useful={s.get('useful_to_outcome', '?')}, "
            f"recommend={s.get('author_would_recommend', '?')})"
        )
        if s.get("is_decision_point"):
            alts = " / ".join(s.get("alternatives_considered") or [])
            chose = s.get("author_chose", "?")
            reasoning = s.get("author_reasoning", "")
            line += f"\n    ⚑ DECISION POINT — alternatives: [{alts}] → chose: {chose}"
            if reasoning:
                line += f" — reasoning: {reasoning}"
        lines.append(line)
    return "\n".join(lines)


def aggregate_batch(journeys: list[dict]) -> list[dict] | None:
    """Aggregate a batch of journeys into canonical nodes."""
    journey_text = "\n\n---\n\n".join(build_journey_summary(j) for j in journeys)

    prompt = AGGREGATE_PROMPT.format(count=len(journeys), journeys=journey_text)

    for attempt in range(3):
        try:
            msg = client.messages.create(
                model=MODEL,
                max_tokens=16000,
                thinking={
                    "type": "enabled",
                    "budget_tokens": 8000,
                },
                messages=[{"role": "user", "content": prompt}],
            )

            raw = None
            for block in msg.content:
                if block.type == "text":
                    raw = block.text.strip()
                    break

            if not raw:
                raise ValueError("No text block in response")

            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]

            nodes = json.loads(raw.strip())
            if not isinstance(nodes, list):
                raise ValueError(f"Expected list, got {type(nodes)}")

            return nodes

        except (json.JSONDecodeError, ValueError) as e:
            if attempt == 2:
                print(f"    Aggregation failed after 3 attempts: {e}")
                return None
            print(f"    Parse error, retrying ({attempt + 1}/3)...")
            time.sleep(3)


def merge_batches_prompt(batch_results: list[list[dict]]) -> list[dict] | None:
    """If we ran multiple batches, do a final merge pass to reconcile them."""
    if len(batch_results) == 1:
        return batch_results[0]

    print("\nMerging batch results into final canonical pathway...")

    all_nodes_text = json.dumps(batch_results, indent=2)

    merge_prompt = f"""You have {len(batch_results)} partial canonical pathway drafts, each built from a subset of journey maps.

Merge them into ONE final canonical pathway. Deduplicate overlapping nodes, reconcile ordering, and combine frequency/importance scores.

Partial pathway drafts:
{all_nodes_text}

Return ONLY a JSON array of merged canonical node objects using the same schema. No other text."""

    for attempt in range(3):
        try:
            msg = client.messages.create(
                model=MODEL,
                max_tokens=8192,
                messages=[{"role": "user", "content": merge_prompt}],
            )

            raw = msg.content[0].text.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]

            return json.loads(raw.strip())

        except (json.JSONDecodeError, ValueError) as e:
            if attempt == 2:
                print(f"    Merge failed: {e}")
                return None
            time.sleep(3)


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", default="journeys_extracted.json",
                        help="Input file (default: journeys_extracted.json)")
    args = parser.parse_args()

    try:
        with open(args.input) as f:
            journeys = json.load(f)
    except FileNotFoundError:
        print(f"{args.input} not found. Run extract.py first.")
        return

    print(f"Loaded {len(journeys)} extracted journeys\n")

    if len(journeys) < 5:
        print("Too few journeys to aggregate meaningfully. Need at least 5.")
        return

    # Run aggregation in batches
    batch_results = []
    for i in range(0, len(journeys), BATCH_SIZE):
        batch = journeys[i : i + BATCH_SIZE]
        batch_num = i // BATCH_SIZE + 1
        total_batches = (len(journeys) + BATCH_SIZE - 1) // BATCH_SIZE
        print(f"Aggregating batch {batch_num}/{total_batches} ({len(batch)} journeys)...")

        nodes = aggregate_batch(batch)
        if nodes:
            batch_results.append(nodes)
            print(f"  ✅ {len(nodes)} canonical nodes produced")
        else:
            print(f"  ❌ Batch failed")

        time.sleep(2)

    if not batch_results:
        print("All batches failed. No output produced.")
        return

    # Merge batches if needed
    canonical = merge_batches_prompt(batch_results)
    if not canonical:
        print("Merge failed. Using first batch result.")
        canonical = batch_results[0]

    # Sort by node_id just in case
    canonical.sort(key=lambda n: n.get("node_id", 999))

    # Save locally
    with open("canonical_pathway.json", "w") as f:
        json.dump(canonical, f, indent=2)
    print(f"\nSaved {len(canonical)} canonical nodes to canonical_pathway.json")

    # Upsert to Supabase (journey_type = 'egg-freezing' for now)
    print("Upserting to Supabase...")
    supabase.table("journeys").upsert(
        {"journey_type": "egg-freezing", "nodes": canonical},
        on_conflict="journey_type",
    ).execute()

    print("\n✅ Done. Canonical egg freezing pathway saved.")
    print(f"\nCanonical steps ({len(canonical)} total):")
    for node in canonical:
        print(f"  {node.get('node_id', '?')}. [{node.get('importance', '?')}] {node.get('title', '?')} — {node.get('frequency', 0)*100:.0f}% of journeys")


if __name__ == "__main__":
    run()
