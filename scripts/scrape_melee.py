#!/usr/bin/env python3
"""
Scrape melee weapon profiles for Kill Team operatives from the card-style
team-rules PDFs on assets.warhammer-community.com.

Inputs
------
- scripts/faction_pdf_urls.json   id -> [candidate URLs] (newest-first hint)
- /tmp/factions.json              Canonical operative list dumped from factions.js
                                  (run: node scripts/dump_factions.mjs > /tmp/factions.json)

Outputs
-------
- src/data/melee.generated.json   { opId: [ {name, atk, hit, normal_dmg, crit_dmg, rules}, ... ] }
- src/data/melee.report.md        Coverage report: matched/unmatched operatives,
                                  novel rule tokens, ambiguous classifications.

Resolution
----------
For each faction with multiple candidate URLs, pick the one whose Last-Modified
header is newest. Cache PDFs in .cache/pdfs/ keyed by URL hash.

Usage
-----
    python3 scripts/scrape_melee.py [faction_id ...]

Pass faction ids on the command line to limit the run; with no args, all
factions are processed.
"""

from __future__ import annotations

import argparse
import email.utils
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / ".cache" / "pdfs"
URL_MAP = ROOT / "scripts" / "faction_pdf_urls.json"
FACTIONS_JSON = Path("/tmp/factions.json")
OUT_JSON = ROOT / "src" / "data" / "melee.generated.json"
OUT_REPORT = ROOT / "src" / "data" / "melee.report.md"

UA = "Mozilla/5.0 (compatible; ballistica-melee-scraper/1.0)"

# A weapon row: pdftotext -layout renders these as
#   "<name>" + 2+ spaces + "<atk>" + 1+ space + "<hit>+" + 1+ space + "<n>/<m>" + (TAB|spaces+\x07) + <rules-or-dash>
ROW_RE = re.compile(
    r"^.*?(?P<name>\S.*?\S)\s{2,}"
    r"(?P<atk>\d)\s+"
    r"(?P<hit>\d\+)\s+"
    r"(?P<ndmg>\d+)/(?P<cdmg>\d+)"
    r"[\t ]+\x07?(?P<rules>.*?)\s*$"
)

# A weapon is definitively ranged if any of its rules starts with one of these
# tokens. Hot-shot lasguns / boltguns have no rules but are still ranged — we
# fall back to a cross-check against the existing ranged dataset for those.
RANGED_RULE_HEADS = {"Range", "Torrent", "Blast", "Saturate", "Heavy", "Seek"}


# ---------------------------------------------------------------------------
# Resolution: pick the newest-Last-Modified candidate URL per faction
# ---------------------------------------------------------------------------

def head(url: str) -> dict:
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as r:
        return {k.lower(): v for k, v in r.getheaders()}


def parse_http_date(s: str) -> float:
    return time.mktime(email.utils.parsedate(s)) if s else 0.0


def pick_newest(candidates: list[str]) -> tuple[str, str | None]:
    """Return (url, last_modified_iso). Falls back to first candidate on error."""
    best_url, best_ts, best_lm = candidates[0], -1.0, None
    for url in candidates:
        try:
            h = head(url)
            ts = parse_http_date(h.get("last-modified", ""))
            if ts > best_ts:
                best_url, best_ts, best_lm = url, ts, h.get("last-modified")
        except Exception as e:
            print(f"  HEAD failed on {url}: {e}", file=sys.stderr)
    return best_url, best_lm


# ---------------------------------------------------------------------------
# Download + extract
# ---------------------------------------------------------------------------

def download(url: str) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    h = hashlib.sha1(url.encode()).hexdigest()[:16]
    out = CACHE / f"{h}.pdf"
    if out.exists() and out.stat().st_size > 0:
        return out
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r, open(out, "wb") as f:
        shutil.copyfileobj(r, f)
    return out


def pdftotext(pdf: Path, mode: str = "layout") -> str:
    if shutil.which("pdftotext") is None:
        raise SystemExit("pdftotext not on PATH; install poppler-utils")
    flag = "-layout" if mode == "layout" else "-raw"
    out = subprocess.check_output(
        ["pdftotext", flag, str(pdf), "-"], text=True, errors="replace"
    )
    return out


# ---------------------------------------------------------------------------
# Datacard segmentation + parsing
# ---------------------------------------------------------------------------

# In the layout-mode dump, each operative datacard has this pattern somewhere:
#   <some context>
#                                   APL  MOVE  SAVE  WOUNDS
#
#   <NAME-LINE-1>
#   [NAME-LINE-2 (optional)]                         3    6"   4+    9
#   NAME                       ATK   HIT   DMG    WR
#   <weapon row>
#   ...
APL_HEADER_RE = re.compile(r"\bAPL\b.*\bMOVE\b.*\bSAVE\b.*\bWOUNDS\b", re.I)
# Stat values line — accepts "4+" or "4 +" (text extraction sometimes splits)
STAT_LINE_RE = re.compile(
    r"\b(?P<apl>\d)\s+(?P<move>\d+\")\s+(?P<save>\d\s*\+)\s+(?P<wounds>\d{1,2})\b"
)
WEAPON_HEADER_RE = re.compile(
    # Accepts both full ("NAME ATK HIT DMG WR") and abbreviated
    # ("NAME A HIT D WR") header forms — Sanctifiers / Goremonger PDFs use
    # the abbreviated form.
    r"\bNAME\b.*\b(?:ATK|A)\b.*\bHIT\b.*\b(?:DMG|D)\b.*\bWR\b",
    re.I,
)
# Operative names are uppercase and may include digits (e.g. "XV26 SHAS'VRE").
NAME_LINE_RE = re.compile(r"^[A-Z][A-Z0-9'’&\- ]{2,}$")


@dataclass
class ParsedWeapon:
    name: str
    atk: int
    hit: int       # die threshold (3 means 3+)
    normal_dmg: int
    crit_dmg: int
    rules: list[str] = field(default_factory=list)


@dataclass
class ParsedCard:
    operative_name: str
    apl: int | None
    move: str | None
    save: int | None
    wounds: int | None
    weapons: list[ParsedWeapon] = field(default_factory=list)


def split_cards(text: str) -> list[list[str]]:
    """Slice text into per-datacard line lists, anchored on APL header.

    Returns a list of line-lists, each starting with the line BEFORE the APL
    header (so we have lookback room for the operative name) and ending at the
    next APL header.
    """
    lines = text.splitlines()
    anchors = [i for i, ln in enumerate(lines) if APL_HEADER_RE.search(ln)]
    if not anchors:
        return []
    cards: list[list[str]] = []
    for a, b in zip(anchors, anchors[1:] + [len(lines)]):
        # take a window from up to 6 lines before the APL header through b
        start = max(0, a - 6)
        cards.append(lines[start:b])
    return cards


def find_operative_name(card_lines: list[str], apl_idx: int) -> str:
    """The operative name appears on the line(s) IMMEDIATELY AFTER the APL
    header, before the stat-values line. Sometimes wraps over two all-caps
    lines, and sometimes the stat values are appended to the end of the second
    name line (e.g. plague-marines: ``BOMBARDIER  3  5"  3+  9``).
    """
    parts: list[str] = []
    for i in range(apl_idx + 1, min(len(card_lines), apl_idx + 5)):
        raw = card_lines[i].rstrip()
        ln = raw.strip()
        if not ln:
            if parts:
                break
            continue
        # if the line has stats embedded, peel them off and consider the prefix
        # as a candidate name continuation
        m = STAT_LINE_RE.search(ln)
        if m:
            prefix = ln[: m.start()].strip()
            cleaned = re.sub(r"[^A-Za-z0-9'’&\- ]", "", prefix).strip()
            if NAME_LINE_RE.match(cleaned):
                parts.append(cleaned)
            break
        cleaned = re.sub(r"[^A-Za-z0-9'’&\- ]", "", ln).strip()
        if NAME_LINE_RE.match(cleaned):
            parts.append(cleaned)
        elif parts:
            break
    return " ".join(parts).strip()


def parse_card(card_lines: list[str]) -> ParsedCard:
    apl_idx = next(
        (i for i, ln in enumerate(card_lines) if APL_HEADER_RE.search(ln)), None
    )
    if apl_idx is None:
        return ParsedCard("", None, None, None, None, [])

    name = find_operative_name(card_lines, apl_idx)

    # find stat values within the next ~6 lines
    apl = move = save = wounds = None
    for ln in card_lines[apl_idx : apl_idx + 8]:
        m = STAT_LINE_RE.search(ln)
        if m:
            apl = int(m.group("apl"))
            move = m.group("move")
            save = int(m.group("save").rstrip("+"))
            wounds = int(m.group("wounds"))
            break

    # walk past the "NAME ATK HIT DMG WR" header
    weapons: list[ParsedWeapon] = []
    after_header = False
    # Some PDFs render side-by-side weapon tables on the same line
    # (e.g. kommandos "Dynamite ... Harpoon ..."). Split such lines so each
    # weapon is parsed independently. We look for 2+ weapon-row signatures
    # on a single line and slice between them.
    sub_signature = re.compile(
        r"\b[A-Z][A-Za-z'’&\-() ]{2,30}\s{2,}\d\s+\d\+\s+\d+/\d+"
    )
    for raw_ln in card_lines[apl_idx:]:
        if WEAPON_HEADER_RE.search(raw_ln):
            after_header = True
            continue
        if not after_header:
            continue
        # try to split if the line contains 2+ weapon-row signatures
        sub_lines = [raw_ln]
        sigs = list(sub_signature.finditer(raw_ln))
        if len(sigs) >= 2:
            sub_lines = []
            for k, sig in enumerate(sigs):
                start = sig.start()
                # for each chunk, take from this sig's start to the next sig's
                # start (or end of line for the last)
                end = sigs[k + 1].start() if k + 1 < len(sigs) else len(raw_ln)
                sub_lines.append("    " + raw_ln[start:end])
        for ln in sub_lines:
            m = ROW_RE.match(ln.rstrip())
            if not m:
                continue
            w_name = m.group("name").strip().lstrip("•").strip()
            # filter obvious non-weapon rows
            if not w_name or len(w_name) > 60:
                continue
            if w_name.upper() in {"NAME", "WR"}:
                continue
            rules_str = m.group("rules").lstrip("\x07").strip()
            # Normalise unicode dashes (figure dash, en-dash, em-dash,
            # non-breaking hyphen, hyphen-minus) so that "no rules" markers
            # are detected uniformly.
            DASH_NO_RULES = {"-", "‑", "–", "—", "−", ""}
            rules = (
                []
                if rules_str in DASH_NO_RULES
                else [r.strip() for r in rules_str.split(",") if r.strip()]
            )
            weapons.append(
                ParsedWeapon(
                    name=w_name,
                    atk=int(m.group("atk")),
                    hit=int(m.group("hit").rstrip("+")),
                    normal_dmg=int(m.group("ndmg")),
                    crit_dmg=int(m.group("cdmg")),
                    rules=rules,
                )
            )
    return ParsedCard(name, apl, move, save, wounds, weapons)


# ---------------------------------------------------------------------------
# Classification
# ---------------------------------------------------------------------------

def is_ranged_by_rules(rules: list[str]) -> bool:
    for r in rules:
        head_token = r.split()[0] if r else ""
        if head_token in RANGED_RULE_HEADS:
            return True
    return False


# ---------------------------------------------------------------------------
# Per-faction pipeline
# ---------------------------------------------------------------------------

@dataclass
class FactionReport:
    id: str
    url: str
    last_modified: str | None = None
    matched_ops: list[str] = field(default_factory=list)
    unmatched_ops: list[str] = field(default_factory=list)
    novel_rule_tokens: set[str] = field(default_factory=set)
    classification_warnings: list[str] = field(default_factory=list)


def normalise(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def match_op_id(card_name: str, faction_ops: list[dict]) -> str | None:
    """Match the parsed card name to an internal operative id by full_name."""
    if not card_name:
        return None
    target = normalise(card_name)
    # exact normalised match against full_name
    for op in faction_ops:
        if normalise(op["full_name"]) == target:
            return op["id"]
    # also try matching against `name` (no faction prefix) as fallback
    for op in faction_ops:
        if normalise(op["name"]) == target:
            return op["id"]
    # substring fallback (helpful for full_name-like cards that include
    # an extra faction tag)
    for op in faction_ops:
        if target.endswith(normalise(op["name"])):
            return op["id"]
    return None


# Known parseRules.js tokens — anything else gets flagged
KNOWN_TOKENS = {
    "Lethal", "Accurate", "Piercing", "Piercing Crits", "Devastating",
    "Range", "Torrent", "Blast", "Hot", "Ceaseless", "Relentless",
    "Balanced", "Severe", "Rending", "Punishing", "Saturate",
    "Brutal", "Shock", "Stun", "Soulstrike", "Heavy", "Silent",
    "Seek", "Seek Light", "Limited", "Concealed Position", "PSYCHIC",
}


def is_known_token(rule: str) -> bool:
    rule = rule.rstrip("*")  # asterisk = team-specific note pointer
    if rule in KNOWN_TOKENS:
        return True
    head_token = rule.split()[0]
    if head_token in KNOWN_TOKENS:
        return True
    # 2-word heads
    if " ".join(rule.split()[:2]) in KNOWN_TOKENS:
        return True
    return False


def process_faction(faction: dict, urls: list[str]) -> tuple[dict, FactionReport]:
    fid = faction["id"]
    url, lm = pick_newest(urls)
    rep = FactionReport(id=fid, url=url, last_modified=lm)
    print(f"\n[{fid}] -> {url}")
    if lm:
        print(f"  last-modified: {lm}")

    pdf = download(url)
    text = pdftotext(pdf, mode="layout")
    cards = split_cards(text)
    print(f"  {len(cards)} datacards found in PDF")

    # build lookup of existing ranged weapon names per operative id
    existing_ranged: dict[str, set[str]] = {
        op["id"]: {w["name"] for w in op["weapons"]} for op in faction["operatives"]
    }

    melee_by_op: dict[str, list[dict]] = defaultdict(list)
    matched_ops_set: set[str] = set()

    for card_lines in cards:
        card = parse_card(card_lines)
        op_id = match_op_id(card.operative_name, faction["operatives"])
        if not op_id:
            if card.operative_name:
                rep.unmatched_ops.append(card.operative_name)
            continue
        matched_ops_set.add(op_id)

        for w in card.weapons:
            # already ranged (cross-check) → skip
            if w.name in existing_ranged.get(op_id, set()):
                continue
            # rules say ranged → skip
            if is_ranged_by_rules(w.rules):
                continue
            # fuzzy ranged-name match — only catches drop-cap mangling on
            # ranged weapons whose first character was eaten by the PDF's
            # decorative initial. We only check the direction
            # `existing.endswith(parsed)` and require the size difference to be
            # 1-2 characters; otherwise we get false positives like
            # `Claws & spark` matching the existing `Spark`.
            existing_norm = {normalise(n): n for n in existing_ranged.get(op_id, set())}
            wnn = normalise(w.name)
            mangled = any(
                en.endswith(wnn) and 1 <= len(en) - len(wnn) <= 2
                for en in existing_norm
                if len(wnn) >= 4
            )
            if mangled:
                rep.classification_warnings.append(
                    f"{op_id}: '{w.name}' fuzzy-matched existing ranged weapon — skipped"
                )
                continue

            # melee
            for r in w.rules:
                if not is_known_token(r):
                    rep.novel_rule_tokens.add(r)
            melee_by_op[op_id].append(
                {
                    "name": w.name,
                    "atk": w.atk,
                    "hit": w.hit,
                    "normal_dmg": w.normal_dmg,
                    "crit_dmg": w.crit_dmg,
                    "rules": w.rules,
                }
            )

    rep.matched_ops = sorted(matched_ops_set)
    return melee_by_op, rep


# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("faction_ids", nargs="*", help="Limit to these faction ids")
    args = ap.parse_args()

    if not FACTIONS_JSON.exists():
        raise SystemExit(
            "Missing /tmp/factions.json; run:\n"
            "  node scripts/dump_factions.mjs > /tmp/factions.json"
        )

    factions = json.loads(FACTIONS_JSON.read_text())
    url_map = json.loads(URL_MAP.read_text())
    factions_by_id = {f["id"]: f for f in factions}

    target_ids = args.faction_ids or [
        f["id"] for f in factions if f["id"] in url_map
    ]

    all_melee: dict[str, list[dict]] = {}
    reports: list[FactionReport] = []

    for fid in target_ids:
        if fid not in factions_by_id:
            print(f"!! unknown faction id: {fid}", file=sys.stderr)
            continue
        if fid not in url_map:
            print(f"!! no URL configured for {fid}", file=sys.stderr)
            continue
        try:
            melee, rep = process_faction(factions_by_id[fid], url_map[fid])
            all_melee.update(melee)
            reports.append(rep)
        except Exception as e:
            print(f"!! {fid} failed: {type(e).__name__}: {e}", file=sys.stderr)

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(all_melee, indent=2, ensure_ascii=False))
    print(f"\nWrote {OUT_JSON} ({len(all_melee)} operatives)")

    # ---- report ----
    lines = ["# Melee scrape report", ""]
    for rep in reports:
        lines.append(f"## {rep.id}")
        lines.append(f"- URL: <{rep.url}>")
        lines.append(f"- Last-Modified: `{rep.last_modified or '—'}`")
        lines.append(f"- Matched operatives: {len(rep.matched_ops)}")
        if rep.unmatched_ops:
            lines.append(f"- **Unmatched datacard names** ({len(rep.unmatched_ops)}):")
            for n in rep.unmatched_ops:
                lines.append(f"  - `{n}`")
        if rep.novel_rule_tokens:
            lines.append("- **Novel rule tokens** (not in parseRules.js):")
            for t in sorted(rep.novel_rule_tokens):
                lines.append(f"  - `{t}`")
        if rep.classification_warnings:
            lines.append("- Classification warnings:")
            for w in rep.classification_warnings:
                lines.append(f"  - {w}")
        lines.append("")
    OUT_REPORT.write_text("\n".join(lines))
    print(f"Wrote {OUT_REPORT}")


if __name__ == "__main__":
    main()
