# CoParent — Project Context for Claude Code

## What This Is
CoParent is a private web app built for Haley and Dave (partners, co-parenting Dave's three boys). It serves two purposes:
1. **Legal documentation** — building a structured record to support a parenting time modification request in Ottawa County, Michigan (20th Circuit Court)
2. **Family journaling** — tracking the boys' growth, moods, positive moments, and day-to-day life

The app is used exclusively by Haley and Dave. It is **not** accessible to Mary (the boys' mother) or anyone else.

---

## The Family
- **Haley** — co-author of this app, primary logger
- **Dave** — Haley's partner, former Marine, skydiving instructor, logs entries too
- **Landon, Luke, Leo** — Dave's three boys (the kids)
- **Mary** — the boys' mother, lives with her parents at 2480; subject of co-parenting and parenting entries
- Current custody: 50/50 legal and physical
- Goal: parenting time modification — the boys have repeatedly and unprompted expressed wanting to spend more time at home (10909)

---

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS — no framework
- **Font**: Jost (Google Fonts)
- **Auth**: Supabase Auth with magic links + password fallback
- **Database**: Supabase (PostgreSQL)
- **Hosting**: GitHub Pages (public repo: haleyelaineg-oss/coparent)
- **Config**: `config.js` holds Supabase credentials + all configurable lists — committed to repo (anon key is safe to be public)

## Files
```
coparent/
├── index.html      — all HTML, page structure, login screens
├── style.css       — all styles, do not change design system
├── script.js       — all JS logic
├── config.js       — Supabase credentials + configurable data (EDIT THIS to change lists)
└── CLAUDE.md       — this file
```

---

## Design System (DO NOT CHANGE)
- Pink/mauve/rose palette — warm, stress-reducing
- CSS variables defined in `style.css` `:root`
- Key colors: `--accent: #c4507a`, `--rose`, `--sage`, `--mauve`, `--amber`
- Sidebar navigation, card-based layout, Jost font throughout
- Mobile responsive

---

## Supabase Setup
- **Project URL**: https://cjomxvxopnjmqfxaqeiu.supabase.co
- **Table**: `entries` (single table for all entry types)
- **Auth**: Email magic links + password, sessions persist (no re-login needed normally)
- **Allowed emails**: haleyelaineg@gmail.com, davidvincent2007@gmail.com, admin@hd-enterprises.us
- RLS enabled — authenticated users can read/insert all entries

### entries table columns
```sql
id uuid primary key
created_at timestamptz
entry_date timestamptz not null
entry_type text not null        -- 'kids' | 'parenting' | 'coparenting' | 'memories' | 'reflection'
entry_subtype text              -- type id from config
entry_subtype_name text         -- human-readable type name
logger text not null            -- 'Haley' or 'Dave'
user_id uuid
people jsonb                    -- array of people involved
location text                   -- from LOCATIONS list
info_source text                -- from INFO_SOURCES list
facts text                      -- objective description of what happened
assessment text                 -- Haley/Dave's interpretation (optional)
quote text                      -- direct quote from a child or person
severity integer                -- 1-5 where 5=positive/good, 1=serious/concerning
witnesses text
attachments jsonb
kids_home boolean               -- reflection entries only
moods jsonb                     -- reflection entries only {Landon:'Happy', ...}
mary_kids_treatment text        -- how Mary treated the kids during interaction
mary_feelings jsonb             -- feelings array from reflection Mary step
```

---

## Entry Categories (defined in config.js)
Four categories, each with subtypes:

### 1. Kids
Kid behaviors, emotions, development. Has severity + info source.
- Emotional positive/negative, Behavioral positive/concern
- Educational accomplishment/struggle, Physical milestone/concern
- Preference expressed, Social interaction

### 2. Parenting (Mary → Kids)
How Mary treats the boys. Has severity + info source.
- Positive parenting, Dismissive/invalidating, Denying choice
- Emotional response, Physical care concern, Kids reported something, Witnessed behavior

### 3. Co-Parenting (Mary ↔ Us)
Communication, schedule, boundaries between Mary and Haley/Dave. Has severity + info source.
- Positive/difficult communication, Schedule violation
- Flexibility we extended / denied by Mary
- Parenting time request, Boundary violation, Kid asked to come home

### 4. Positive Moments & Memories
Warm entries — milestones, wins, memories. No severity or info source.
- Milestone, Funny moment, Proud moment, Connection, Accomplishment, First time, Memory

---

## Key Design Decisions (don't undo these)
- **Facts vs Assessment**: Every entry has separate fields. Facts = objective. Assessment = interpretation. Both optional. This is intentional — counters gaslighting, makes documentation legally credible.
- **Severity scale**: 5=very positive, 1=very serious. Inverted from typical scales intentionally.
- **Information Source**: Tracks how we know what we know (witnessed, kids reported, direct communication, school reported). Adds credibility weight.
- **Location**: Configurable list including "10909 (Home)" and "2480 (Grandparents/Mom's)" — the specific address naming is intentional (documents that she lives with her parents, which the boys have expressed doesn't feel like home).
- **No tags**: Removed deliberately. Category + type handles classification. Tags were redundant.
- **No flag for motion**: All entries are considered relevant. No need to flag.
- **Single table**: All entry types in one `entries` table with `entry_type` column. Simpler to query and filter.
- **Config-driven**: All lists (people, locations, sources, categories, types, moods, feelings, check-ins) live in `config.js`. Easy to update without touching logic.

---

## Pages
1. **Dashboard** — greeting, quick-action buttons, check-in items list
2. **Daily Reflection** — guided multi-step flow creating multiple entries per session
3. **New Entry** — category-first capture form, adapts fields based on category
4. **View Log** — three tabs: Feed (filterable) / By Person / Trends (bar charts)
5. **Export** — checkboxes for which categories to include, date range filter, generates attorney-formatted text report

---

## Daily Reflection Flow
Step 0: Who's logging
Step 1: Kids home today?
Step 2: (if home) Mood per kid — emoji grid
Step 3: (if home) Kid observations — quick-add mini entries
Step 4: Mary contact today?
Step 5: (if yes) Mary interaction — severity likert, feelings multi-select, kids treatment chips, notes + additional entries
Step 6: Review all entries → Save all at once

Each reflection session creates multiple individual entries in the entries table.

---

## Legal Context (important for understanding why things are the way they are)
- Michigan Child Custody Act, MCL 722.23 — 12 best-interest factors
- Ottawa County, 20th Circuit Court
- Vodvarka threshold must be met to modify custody (significant change in circumstances)
- Key factors being documented: A (emotional bond), I (child preference), J (co-parenting cooperation), K (domestic violence/emotional abuse)
- The boys have repeatedly and unpromptedly expressed wanting to spend majority of time at home
- Luke specifically requested 80% home / 20% mom's
- Mary's pattern: dismissive, invalidating, denying kids' choice and autonomy, hot/cold behavior
- Documentation strategy: objective facts separate from assessment, information source tracked for credibility, balanced record (positives AND negatives)

---

## Current Status
- App recently rebuilt from scratch with new entry structure
- Auth working (magic links + password)
- Supabase table created with new schema
- All four files uploaded to GitHub, deploying via GitHub Pages
- May have bugs from the rebuild — test all pages when starting a session

## Known issues to check
- Verify New Entry form works end-to-end
- Verify Daily Reflection saves correctly to Supabase
- Verify View Log renders all three tabs
- Verify Export generates correctly
- Test on mobile (sidebar hides on mobile)

---

## How Haley and Dave Work
- Haley is primary developer working with Claude
- Dave is non-technical — just uses the app via the URL
- Both log in via magic link or password
- Logger is auto-set based on who's logged in (email → display name mapping in config.js)
- Check-in items (currently homework tracking for specific boys) configured in config.js
