# WTF Fertility — Sitemap & Architecture

_Last updated: 2026-03-27_

---

## User Flow

```mermaid
flowchart TD
    A([User visits site]) --> B{Auth state}
    B -- loading --> SPIN[Blank screen]
    B -- not logged in --> LOGIN[LoginScreen\nGoogle OAuth button]
    B -- logged in --> SHELL[AppShell\nSticky header + avatar dropdown]

    LOGIN -->|supabase.auth.signInWithOAuth| SHELL
    SHELL --> PP[ProductPage\nTab bar router]

    PP --> T1[Divya's Story\nDefault tab]
    PP --> T2[Your Journey]
    PP --> T3[What Others Are Saying]
    PP --> T4[Egg Freezing Pathways]

    SHELL -->|Sign out| LOGIN
```

---

## Tab: Divya's Story

```mermaid
flowchart TD
    T1[Divya's Story] --> HERO[LandingHero\nFeature cards]
    T1 --> CHAT[ChatIntro\nChat bubbles — Mar 4 2024]
    T1 --> SUMMARY[CycleSummaryCard\nClinic · dates · baseline AFC]
    T1 --> VIEWS{View toggle}

    VIEWS --> SS[SpreadsheetView\n4 sheets]
    VIEWS --> CV[ChartView\nFollicle growth + E2 line charts]
    VIEWS --> FV[FollicleViz\nCanvas bubble viz left/right ovaries]

    SS --> S1[Medications sheet]
    SS --> S2[Hormones & Labs sheet]
    SS --> S3[Follicle Data sheet]
    SS --> S4[Symptoms & Notes sheet]

    DATA[(divyaData.js\nReal cycle data\nMar 4–14 2024)] -.-> T1
```

---

## Tab: Your Journey

```mermaid
flowchart TD
    T2[Your Journey] --> DAYNAV[DayNav\nDay 1–7+ pills]
    T2 --> BANNER[TimelineBanner\nPhase label by day]
    T2 --> EXPECT[WhatToExpect\nGuidance + questions to ask doctor]

    T2 --> PROCHECK{Protocol saved?}
    PROCHECK -- No --> SETUP[ProtocolSetup\nMedication selector]
    PROCHECK -- Yes --> LOG[Daily logging section]

    LOG --> MEDS[MedSpreadsheet\nDose + time inputs]
    LOG --> ULTRA{Had ultrasound?}
    ULTRA -- Yes --> MON[MonitoringLog\nE2 · LH · P4 · follicle count]
    ULTRA -- No --> MOOD
    MON --> MOOD[MoodSelector\n16 mood options]
    MOOD --> NOTES[Notes textarea]
    NOTES --> SAVE[Save button]

    SAVE -->|upsert| DB1[(Supabase\njournal_entries\nmed_logs\nmonitoring_logs\nprotocols)]

    HOOK1[useProtocol] -.-> T2
    HOOK2[useJourneyDay] -.-> T2
    CACHE1[(localStorage cache)] -.->|instant init| T2
    DB1 -.->|async sync| T2
```

---

## Tab: What Others Are Saying

```mermaid
flowchart TD
    T3[What Others Are Saying] --> DPICK[Day picker\nDay 1–7+]
    DPICK --> CARDS[3 InsightCards\nAI-synthesized theme cards]

    DB2[(Supabase\nday_insights table\ncards jsonb)] -.->|useDayInsights| CARDS
```

---

## Tab: Egg Freezing Pathways

```mermaid
flowchart TD
    T4[Egg Freezing Pathways] --> PROFCHECK{Has profile?}
    PROFCHECK -- No --> INTAKE[ProfileIntake modal\n4-step form]
    INTAKE -->|saveProfile| T4

    PROFCHECK -- Yes --> NAV[NodeNav\nPhase-segmented circles]
    NAV --> CARD[NodeDetailCard]

    CARD --> BADGE[YOU ARE HERE badge\nif current node]
    CARD --> TITLE[Title + importance badge]
    CARD --> DESC[Description]
    CARD --> CHOICES[CollapsibleChoices\nOptions + frequency bars\n+ community note]
    CARD --> ASK[AskQuestion\nText input + streaming Claude Haiku]
    CARD --> CHECK[Mark step complete checkbox]

    ASK -->|fetch SSE| CLAUDE[Anthropic API\nclaude-haiku-4-5]
    CLAUDE -->|stream text| ASK

    DB3[(Supabase\njourneys table\nnodes jsonb)] -.->|useJourneys| NAV
    DB4[(Supabase\nuser_profiles table)] -.->|useUserProfile| T4
    CACHE2[(localStorage\nwtf_completed_nodes)] -.-> CHECK

    subgraph Phases
        P1[Prep\nnodes 1–3]
        P2[Meds\nnodes 4–5]
        P3[Retrieval\nnode 6]
        P4[Embryo Making\nnodes 7–8]
        P5[PGT-A\nnode 9]
        P6[Next Steps\nnodes 10–13]
    end
    NAV --> Phases
```

---

## Data Architecture

```mermaid
flowchart LR
    subgraph Frontend
        HOOKS[React Hooks]
        COMPS[Components]
        LS[(localStorage\ncache)]
    end

    subgraph Supabase
        AUTH[Google OAuth]
        subgraph UserTables[User Tables — RLS]
            protocols
            journal_entries
            med_logs
            monitoring_logs
            user_profiles
        end
        subgraph RAGTables[RAG Tables — public read]
            posts
            day_insights
            journeys
        end
        PGVEC[pgvector\nmatch_posts function]
    end

    subgraph ExternalAPIs
        ANTHROPIC[Anthropic\nClaude Haiku\nStreaming Q&A]
        OPENAI[OpenAI\ntext-embedding-3-small]
    end

    subgraph ScraperPipeline[Scraper Pipeline — run locally]
        SCRAPER[scraper.py\nold.reddit.com via curl]
        POSTSJSON[(posts.json)]
        EMBED[embed.py\nCI weekly]
        SYNTH[synthesize.py\nCI weekly]
        CLASSIFY[classify.py]
        EXTRACT[extract.py\nClaude Sonnet + thinking]
        AGGREGATE[aggregate.py\nClaude Sonnet + thinking]
        PATHWAY[(canonical_pathway.json)]
    end

    SCRAPER --> POSTSJSON
    POSTSJSON --> CLASSIFY --> EXTRACT --> AGGREGATE --> PATHWAY
    PATHWAY -->|upsert| journeys
    POSTSJSON --> EMBED --> OPENAI --> posts
    posts --> SYNTH --> ANTHROPIC --> day_insights

    HOOKS <-->|anon key| UserTables
    HOOKS -->|read| RAGTables
    HOOKS <--> LS
    COMPS --> ANTHROPIC
    AUTH --> Frontend
```

---

## Deployment

```mermaid
flowchart LR
    DEV[Local dev\nnpm start\nlocalhost:3000/WTFv1] -->|git push main| GHA[GitHub Actions\ndeploy.yml]
    GHA -->|npm build| GHPAGES[gh-pages branch]
    GHPAGES --> LIVE[Live site\ndivyaspatel.github.io/WTFv1]

    GHA2[GitHub Actions\nscrape.yml\nMonday 6am UTC] -->|python embed.py| SUP[Supabase posts]
    GHA2 -->|python synthesize.py| SUP2[Supabase day_insights]
```
