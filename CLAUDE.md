# CLAUDE.md

## Warhammer Community PDFs — source of truth

When verifying Kill Team rules, always use the **card-style** PDFs on Warhammer Community (the regularly-updated cut-out card format), **not** the page-by-page reader-style PDFs.

The card-style team-rules PDFs live at:

```
https://assets.warhammer-community.com/rules-downloads/kill-team/team-rules/<faction-slug>/killteam_teamrules_<factionslug>_eng_<dd.mm.yy>.pdf
```

Example (Vespid Stingwings, Oct 2 2024):
```
https://assets.warhammer-community.com/rules-downloads/kill-team/team-rules/vespid-stingwings/killteam_teamrules_vespidstingwings_eng_02.10.24.pdf
```

Notes:
- `<faction-slug>` is hyphenated (e.g. `vespid-stingwings`); `<factionslug>` in the filename is the same with hyphens stripped.
- The date in the filename is the rules-update date in `dd.mm.yy`. Probe likely dates with `curl -s -o /dev/null -w '%{http_code}'` until you find a `200`.
- The Kill Team downloads hub is rendered client-side, so a plain HTML fetch won't surface the PDF links — search for them directly.

**Avoid** URLs that look like `eng_19-11_kt_<faction>_online_rules-...pdf` — that's the page-by-page reader version and isn't refreshed with errata.
