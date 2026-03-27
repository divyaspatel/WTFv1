# WTF Fertility — Decision Log

Append an entry here for every change, regardless of size.

Format:
```
## YYYY-MM-DD — [What changed]
**Why:** ...
**Considered:** ...
**Affects:** ...
```

---

## 2026-03-27 — Replaced snake map → horizontal circles → phase-segmented node nav

**Why:** Snake map was overwhelming. Horizontal circles were cleaner but had no phase context. Phase segments give users orientation ("where am I in the overall journey?") without adding cognitive load.

**Considered:**
- Phase circles (6 big circles, one per phase) — too coarse, lost individual step granularity
- Horizontal scroll of individual dots — all fit but no phase grouping
- Phase segments with one dot per node — chosen: scales to any node count, fits on screen, shows phases

**Affects:** `JourneysTab.js`, `index.css` (node-nav-wrapper, node-nav-seg, node-nav-dot classes)

---

## 2026-03-27 — Current node indicator changed from yellow pulse → pastel green pulse

**Why:** Yellow felt like a warning. Green reads as "you are here, you're doing great" — warmer and more encouraging.

**Considered:** Yellow (#FFD166), terracotta (matches brand but too similar to past nodes), green

**Affects:** `.node-nav-dot.current` in `index.css`

---

## 2026-03-27 — Added phase labels above and "You are here" below the node nav

**Why:** Without labels, users couldn't tell which colored segment corresponded to which phase. "You are here" below the current dot makes the user's position unambiguous.

**Considered:** Labels inside the phase pills (too cramped), tooltips on hover (too hidden), labels above (chosen)

**Affects:** `NodeNav` component in `JourneysTab.js`, `.node-nav-labels`, `.node-you-are-here` in `index.css`

---

## 2026-03-27 — Fixed PHASE_CONFIG node ID ranges to match actual canonical pathway (1–13)

**Why:** PHASE_CONFIG was hardcoded with assumed node IDs (up to 19). The aggregated pathway only has 13 nodes. Phases mapped to IDs 8+ were empty, making "Next Steps" and other phases disappear.

**Considered:** Re-running aggregation to produce more nodes — decided to remap IDs to actual data instead

**Affects:** `PHASE_CONFIG` and `STAGE_TO_CURRENT_NODE` in `JourneysTab.js`

---

## 2026-03-27 — Added favicon (terracotta "W" SVG)

**Why:** Browser tab showed default React icon. Brand identity.

**Considered:** PNG favicon (requires multiple sizes), SVG (scales perfectly, one file) — chose SVG

**Affects:** `public/favicon.svg` (new file), `public/index.html` (added link tag)

---

## 2026-03-27 — Rewrote NodeDetailCard with streaming Claude Q&A + collapsible choices

**Why:** Reference design had inline Q&A so users could ask questions without leaving the step context. Streaming feels more conversational ("like texting a friend").

**Considered:**
- Pre-generated Q&A (static, cheap, but can't handle specific questions)
- Server-side proxy (more secure but adds infrastructure)
- Direct browser API call with `anthropic-dangerous-direct-browser-access` header (chosen — simpler, acceptable for demo)

**Affects:** `JourneysTab.js` (NodeDetailCard, AskQuestion, CollapsibleChoices), `index.css` (node-detail-card, ask-section, choices-section classes), requires `REACT_APP_ANTHROPIC_API_KEY` env var

---

## 2026-03-27 — Added "Mark as complete" checkbox (persisted to localStorage)

**Why:** Users wanted to track progress through the pathway. localStorage is sufficient — no need for server persistence for this feature yet.

**Considered:** Supabase persistence (overkill for now), in-memory state (lost on refresh), localStorage (chosen)

**Affects:** `JourneysTab.js` (completedNodes state + handleMarkComplete), `index.css` (.mark-complete-row)

---

## 2026-03-27 — Expanded Reddit corpus from ~973 → 2385 posts across 6 subreddits

**Why:** Larger corpus = more representative canonical pathway. Added r/infertility, r/PCOS, r/endometriosis to capture women who freeze for medical reasons, not just elective.

**Considered:** Scraping more from existing subreddits vs. adding new ones — chose both

**Affects:** `scraper/scraper.py` (ANCHOR_SUB, OTHER_SUBS, TARGET_TOTAL, expanded KEYWORDS), `scraper/posts.json`

---

## 2026-03-27 — Added `out_of_scope` class + `single_moment` to usable classes in classifier

**Why:** Transfer/TWW/pregnancy posts were polluting the egg-freezing pathway. `single_moment` posts were being excluded but contain valid individual data points that map to pathway nodes.

**Considered:** Stricter keyword filtering at scrape time (blunt), classifier-level filtering (chosen — more semantic)

**Affects:** `scraper/classify.py` (JOURNEY_CLASSES, USABLE_CLASSES, CLASSIFY_PROMPT), `scraper/extract.py` (USABLE_CLASSES)

---

## 2026-03-27 — Added `financial` and `clinic_selection` step categories to extract/aggregate

**Why:** Community data showed these are real, distinct decision moments in the journey. Lumping them into "admin" or "consultation" lost signal.

**Considered:** Keeping 6 categories (simpler schema), adding both (chosen — matches actual community language)

**Affects:** `scraper/extract.py` (STEP_CATEGORIES, EXTRACT_PROMPT), `scraper/aggregate.py` (AGGREGATE_PROMPT)

---

## 2026-03-27 — Removed IVF/embryo banking tabs, renamed "Journeys" → "Egg Freezing Pathways"

**Why:** App is focused on egg freezing, not IVF transfer cycles. Multiple tabs implied scope that doesn't exist yet. Clearer label sets correct user expectations.

**Considered:** Keeping tabs with "coming soon" state (adds noise), removing tabs entirely (chosen)

**Affects:** `pages/ProductPage.js` (tab definitions), `JourneysTab.js` (always uses 'egg-freezing' journey type)

---

## 2026-03-27 — Removed Cycle Tracker pill from header

**Why:** Feature doesn't exist yet. Showing placeholder UI elements erodes trust.

**Affects:** `components/AppShell.js`

---

## 2026-03-27 — ProfileIntake: replaced Age with Name + City, updated journey stage labels

**Why:** Age was being used for personalization but felt clinical. Name makes the experience feel personal. City is useful for future clinic recommendations. Journey stage labels were too medical — rewritten in plain language.

**Considered:** Keeping age for personalization logic — decided personalization can be done without it

**Affects:** `components/profile/ProfileIntake.js`, `hooks/useUserProfile.js` (profile schema)
