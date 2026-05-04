# CLAUDE.md

## Warhammer Community PDFs — source of truth

When verifying Kill Team rules, always use the **card-style** PDFs on Warhammer Community (the regularly-updated cut-out card format), **not** the page-by-page reader-style PDFs.

### Current URL pattern (use this)

Since the 2025 balance updates, card-style team-rules PDFs are published with random hash suffixes:

```
https://assets.warhammer-community.com/eng_<date-token>_kt_teamrules_<slug>-<hash1>-<hash2>.pdf
```

`<date-token>` is one of:
- `dd-mm` — e.g. `29-04`, `28-01`, `29-10`, `25-02`
- `<mon><yy>` — e.g. `jun25`, `jul25`, `sept25`, `jan25`

`<slug>` uses **underscores not hyphens** (e.g. `vespid_stingwings`, `wolf_scout`, `chaos_cult`, `wrecka_krew`, `scout_squad`). A pre-2025 variant uses `kill_team_team_rules` instead of `kt_teamrules` in the path.

The two trailing hash segments are random and **uncrackable** — you cannot construct these URLs by date probing. They must be discovered.

Example (Murderwing, last-modified 27 Apr 2026):
```
https://assets.warhammer-community.com/eng_29-04_kt_teamrules_murderwing-ws5qr6gye1-apk2xviaml.pdf
```

### Discovering a faction's current PDF URL

Use a search engine — `assets.warhammer-community.com` is publicly indexed:

```
site:assets.warhammer-community.com kt_teamrules <faction>
```

Try both hyphen and underscore slug forms. The Warhammer Community downloads hub itself is rendered client-side, so a plain HTML fetch of `/en-gb/downloads/kill-team/` will NOT surface the PDF links.

A curated map of `<faction-id> → <current PDF URL>` lives at `scripts/faction_pdf_urls.json` — prefer that to running fresh searches.

### Legacy URL pattern (still hosted but stale)

The 2024-edition launch URLs are still live but **frozen at `02.10.24`** and missing post-launch errata:

```
https://assets.warhammer-community.com/rules-downloads/kill-team/team-rules/<faction-slug>/killteam_teamrules_<factionslug>_eng_02.10.24.pdf
```

Use these only as a fallback when search-driven discovery fails for a faction.

### Avoid

URLs that look like `eng_19-11_kt_<faction>_online_rules-…pdf` — that's the page-by-page reader version and isn't refreshed with errata.
