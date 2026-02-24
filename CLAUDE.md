# WTF Fertility — Project Context

## What This Is
WTF (what the fertility) is a web app that helps women navigate egg freezing and IVF cycles. Built by Divya Patel, who froze her eggs/embryos at 29 at RMANY in NYC (March 2024). The app uses her real cycle data as demo content to show users what tracking looks like in practice.

**Core philosophy:** feels like texting your most informed girlfriend — warm, personal, honest. NOT clinical or software-y.

**Live URL:** https://divyaspatel.github.io/WTFv1/
**GitHub repo:** https://github.com/divyaspatel/WTFv1

---

## Tech Stack
- **Frontend:** Create React App (React 18)
- **Auth:** Supabase Google OAuth
- **Database:** Supabase (agsxcnxfsawplkieochk.supabase.co) + pgvector for RAG
- **Charts:** react-chartjs-2 + chart.js
- **Embeddings:** OpenAI text-embedding-3-small (1536 dims)
- **Synthesis:** Claude Haiku (claude-haiku-4-5-20251001)
- **Hosting:** GitHub Pages via GitHub Actions (`gh-pages` branch)
- **Fonts:** Lora (italic serif headings) + Nunito (body/UI)
- **Colors:** Terracotta (#D4714A), cream (#FDF6EE), sage (#6A9E7A), warm browns

---

## Current File Structure

```
WTFv1-site/
├── public/index.html                  ← minimal CRA template (Google Fonts link + <div id="root">)
├── src/
│   ├── App.js                         ← reads auth state, renders LoginScreen or AppShell
│   ├── index.js                       ← wraps app in AuthProvider, imports index.css
│   ├── index.css                      ← full design system (1700+ lines, CSS custom properties)
│   ├── lib/supabaseClient.js          ← Supabase singleton (anon key)
│   ├── context/AuthContext.js         ← onAuthStateChange listener; user=undefined=loading, null=logged out
│   ├── data/
│   │   ├── divyaData.js               ← Divya's real cycle data (follicles, E2, lining, etc.)
│   │   ├── medCategories.js           ← MED_CATEGORIES object
│   │   ├── feels.js                   ← FEELS array (16 mood options)
│   │   ├── dayContent.js              ← DAY_CONTENT + timelineForDay() + contentForDay() helpers
│   │   └── insights.json             ← legacy hardcoded community insights (no longer used in UI)
│   ├── hooks/
│   │   ├── useProtocol.js             ← loads/saves protocol from Supabase + localStorage cache
│   │   ├── useJourneyDay.js           ← loads/saves day logs from 3 Supabase tables + localStorage
│   │   └── useDayInsights.js          ← fetches day_insights cards from Supabase by cycle_day
│   └── components/
│       ├── LoginScreen.js             ← Google OAuth login card
│       ├── AppShell.js                ← sticky header, avatar, sign out
│       ├── Toast.js                   ← configurable toast notification
│       ├── DisclaimerBar.js           ← fixed bottom "not medical advice" bar
│       ├── tabs/
│       │   ├── DivyaTab.js            ← assembles Divya's Story tab
│       │   ├── JourneyTab.js          ← assembles Your Journey tab
│       │   └── CommunityTab.js        ← day picker + AI-synthesized Reddit cards from Supabase
│       ├── divya/
│       │   ├── ChatIntro.js           ← chat bubble conversation (Mar 4, 2024)
│       │   ├── CycleSummaryCard.js    ← cycle at a glance card
│       │   ├── SpreadsheetView.js     ← 4-subtab spreadsheet (meds, hormones, follicles, symptoms)
│       │   ├── ChartView.js           ← follicle growth + E2 line charts (Chart.js)
│       │   └── FollicleViz.js         ← canvas follicle bubble viz, color-coded by size
│       └── journey/
│           ├── DayNav.js              ← Day 1–7+ tab pills
│           ├── TimelineBanner.js      ← colored timeline segment banner
│           ├── WhatToExpect.js        ← per-day content + questions for doctor
│           ├── ProtocolSetup.js       ← medication protocol builder
│           ├── MedSpreadsheet.js      ← daily medication dose/time tracking grid
│           ├── MonitoringLog.js       ← E2/LH/P4/follicle count inputs
│           └── MoodSelector.js        ← 16-option mood picker
├── scraper/
│   ├── scraper.py                     ← scrapes old.reddit.com (run locally, NOT in CI)
│   ├── embed.py                       ← chunks posts, generates embeddings, upserts to Supabase
│   ├── synthesize.py                  ← generates 3 theme cards per day via Claude, saves to day_insights
│   ├── posts.json                     ← scraped posts (committed to repo, updated locally)
│   ├── requirements.txt               ← openai, anthropic, supabase, python-dotenv
│   └── .gitignore                     ← excludes .env only
└── .github/workflows/
    ├── deploy.yml                     ← push to main → npm build → deploy to gh-pages
    └── scrape.yml                     ← runs embed.py + synthesize.py weekly (Monday 6am UTC)
```

---

## What's Built (all complete)

### Three tabs:
1. **Start Here — Divya's Story** (default tab)
   - Chat bubble UI telling Divya's story
   - Real cycle data: medications, hormones, follicle data, symptoms
   - Interactive visualizations: line charts (follicle growth, E2 levels), follicle bubble viz
   - Spreadsheet views: medications, hormones & labs, follicle data, symptoms & notes

2. **Your Journey**
   - Day-by-day tracker (Days 1–7+)
   - Medication protocol setup + daily logging spreadsheet
   - Ultrasound & bloodwork toggle with E2/LH/P4/follicle count inputs
   - Mood/feels tracker (16 options) + daily notes journal
   - Questions to ask your doctor (changes by day)
   - All data persisted to Supabase (with localStorage as instant cache/offline fallback)

3. **What Others Are Saying**
   - Day picker (Day 1–7+)
   - AI-synthesized theme cards fetched from Supabase `day_insights` table
   - Generated from 973 real Reddit posts via pgvector similarity search + Claude synthesis
   - Refreshed weekly via GitHub Actions

### Auth + infrastructure:
- Google OAuth login via Supabase
- Sticky medical disclaimer bar at bottom
- Toast notifications on save
- GitHub Actions CI/CD: deploy on push + weekly scrape pipeline

---

## Supabase Tables

### User data (RLS: users see only their own rows)
| Table | Key columns | Unique constraint |
|-------|-------------|-------------------|
| `protocols` | user_id, medications (jsonb) | user_id |
| `journal_entries` | user_id, cycle_day, mood, notes | user_id + cycle_day |
| `med_logs` | user_id, cycle_day, med_name, dose, time_taken | user_id + cycle_day + med_name |
| `monitoring_logs` | user_id, cycle_day, e2, lh, p4, follicle_count | user_id + cycle_day |

### RAG data (public read, service role write)
| Table | Key columns |
|-------|-------------|
| `posts` | id (post_id + chunk_index), subreddit, title, chunk_text, embedding (vector 1536) |
| `day_insights` | cycle_day (1–7), cards (jsonb array of 3 cards) |

### SQL functions
- `match_posts(query_embedding, match_count, filter_subreddit)` — pgvector cosine similarity search

---

## Supabase Config
- Project: WTF-whatthefertility
- URL: agsxcnxfsawplkieochk.supabase.co
- Auth: Google OAuth enabled
- Site URL + Redirect URL: https://divyaspatel.github.io/WTFv1/
- pgvector: enabled

---

## RAG Pipeline

**How it works:**
1. `scraper.py` — fetch posts from old.reddit.com/r/IVF, r/eggfreezing, r/fertility using curl (bypasses Python TLS fingerprinting). Filter by fertility keywords. Save to `posts.json`.
2. `embed.py` — chunk posts (500 words, 50 overlap), embed via OpenAI text-embedding-3-small, upsert to `posts` table. Idempotent — skips already-embedded posts.
3. `synthesize.py` — for each day 1–7+, embed a day-specific query, retrieve top 15 posts via `match_posts`, ask Claude Haiku to synthesize 3 theme cards as JSON, upsert to `day_insights`.

**Important: Reddit blocks data center IPs (GitHub Actions, AWS, etc.).** The scraper must be run locally. Only embed.py and synthesize.py run in CI.

**Weekly workflow (manual part):**
```bash
cd WTFv1-site/scraper
python3 scraper.py       # run locally
git add posts.json && git commit -m "refresh posts" && git push
# GitHub Actions automatically runs embed.py + synthesize.py
```

---

## Deployment
- Push to `main` → GitHub Actions builds React app → deploys to `gh-pages` branch
- Live at https://divyaspatel.github.io/WTFv1/ in ~2 minutes
- Workflow: `.github/workflows/deploy.yml`

---

## Environment Variables
Stored as GitHub Actions secrets (set via `gh secret set`). Also needed locally in `scraper/.env`:
```
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
SUPABASE_URL=https://agsxcnxfsawplkieochk.supabase.co
SUPABASE_SERVICE_KEY=...   ← service role key (bypasses RLS, server-side only)
```
The React app uses the **anon key** (safe to be public) hardcoded in `src/lib/supabaseClient.js`.

---

## Design Rules (important!)
- **Fonts:** Lora for all headings/display (italic), Nunito for body/UI. Never Inter or system fonts.
- **Tone:** Warm, personal, like a friend texting you — never clinical
- **Colors:** Terracotta is primary accent, sage is secondary, cream is background
- **No emoji in UI chrome** — only in content/chat bubbles
- **Tab style:** Browser-style raised tabs with border, active tab merges into content
- **Chat bubbles:** `.chat-bubble.her` (terracotta/cream) for Divya, `.chat-bubble.me` (sage) for user
- **Medical disclaimer:** Fixed sticky bar at bottom of every page — do not remove
- **JSX rules:** `class` → `className`, `colspan` → `colSpan`, `for` → `htmlFor`, `<br>` → `<br />`, `<input>` → `<input />`

---

## What's Next
- **Personalized AI guidance:** combine user's own tracking data with RAG corpus for contextual day-by-day responses
- **More Reddit posts:** run scraper.py locally periodically and push updated posts.json
- **Additional subreddits or keyword expansion** as the corpus grows
