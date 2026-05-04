#!/usr/bin/env python3
"""
Merge src/data/melee.generated.json into src/data/factions.js.

For each operative referenced in the generated JSON, insert melee weapon
entries (with `kind: "melee"`) at the end of that operative's `weapons` array
in factions.js. Existing entries are NOT touched — this script is purely
additive.

Usage:
    python3 scripts/merge_melee.py [--dry-run]

The JS file's existing formatting is preserved by only inserting new lines;
no other reformatting is applied.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FACTIONS_JS = ROOT / "src" / "data" / "factions.js"
MELEE_JSON = ROOT / "src" / "data" / "melee.generated.json"


def js_escape(s: str) -> str:
    """Escape a string for inclusion in a JS double-quoted literal."""
    return s.replace("\\", "\\\\").replace('"', '\\"')


def fmt_weapon(w: dict) -> str:
    """Format a melee weapon as a one-line JS object literal."""
    rules = ", ".join(f'"{js_escape(r)}"' for r in w["rules"])
    return (
        f'{{ name: "{js_escape(w["name"])}", '
        f"atk: {w['atk']}, hit: {w['hit']}, "
        f"normal_dmg: {w['normal_dmg']}, crit_dmg: {w['crit_dmg']}, "
        f"rules: [{rules}], kind: \"melee\" }}"
    )


def find_op_block(src: str, op_id: str) -> tuple[int, int] | None:
    """Locate `id: "<op_id>"` and return the slice spanning that operative
    object's `weapons: [ ... ]` array. Returns (open_bracket_idx, close_idx)
    where src[open_bracket_idx] == '[' and src[close_idx] == ']'.
    """
    needle = f'id: "{op_id}"'
    i = src.find(needle)
    if i < 0:
        return None
    # find next "weapons: [" after this id
    j = src.find("weapons: [", i)
    if j < 0:
        return None
    open_idx = j + len("weapons: ")  # points at '['
    assert src[open_idx] == "[", src[open_idx : open_idx + 20]
    # walk forward, counting brackets
    depth = 0
    k = open_idx
    while k < len(src):
        c = src[k]
        if c == "[":
            depth += 1
        elif c == "]":
            depth -= 1
            if depth == 0:
                return open_idx, k
        k += 1
    return None


def detect_indent(src: str, open_idx: int, close_idx: int) -> str:
    """Return the leading whitespace used by existing weapon entries inside
    the array. We look at the line immediately before the closing bracket."""
    chunk = src[open_idx + 1 : close_idx]
    # find last newline + leading whitespace before closing bracket
    lines = chunk.splitlines()
    for ln in reversed(lines):
        m = re.match(r"^(\s+)\S", ln)
        if m:
            return m.group(1)
    # fallback: use 10-space indent (matches the pattern in factions.js)
    return "          "


def insert_melee(src: str, op_id: str, melee_weapons: list[dict]) -> tuple[str, int]:
    block = find_op_block(src, op_id)
    if not block:
        return src, 0
    open_idx, close_idx = block

    # idempotency: skip melee weapons that are already present (same name +
    # kind:"melee" on the same line).
    existing_block = src[open_idx + 1 : close_idx]
    filtered = []
    for w in melee_weapons:
        line_marker = f'name: "{js_escape(w["name"])}"'
        already = any(
            line_marker in ln and 'kind: "melee"' in ln
            for ln in existing_block.splitlines()
        )
        if not already:
            filtered.append(w)
    if not filtered:
        return src, 0

    # find what's between the last newline before close_idx and close_idx —
    # if it's all whitespace, the close bracket is on its own line and we use
    # its leading whitespace as the bracket indent. Otherwise the array is on
    # a single line (e.g. `weapons: []`) and we synthesise a multi-line form.
    last_nl = src.rfind("\n", 0, close_idx)
    line_to_close = src[last_nl + 1 : close_idx]
    is_single_line = bool(line_to_close.strip())

    if is_single_line:
        # Empty or single-line array. Replace `[...]` with a multi-line form
        # using the indent of the line containing `weapons:`.
        weapons_line_start = last_nl + 1
        weapons_indent = line_to_close[: len(line_to_close) - len(line_to_close.lstrip())]
        item_indent = weapons_indent + "  "
        # original content between [ and ]
        inner = src[open_idx + 1 : close_idx].strip().rstrip(",")
        body_lines = []
        if inner:
            body_lines.append(item_indent + inner + ",")
        for w in filtered:
            body_lines.append(item_indent + fmt_weapon(w) + ",")
        new_block = "[\n" + "\n".join(body_lines) + "\n" + weapons_indent + "]"
        new_src = src[:open_idx] + new_block + src[close_idx + 1 :]
        return new_src, len(filtered)

    # Multi-line array path: insert before the existing closing-bracket line.
    indent = detect_indent(src, open_idx, close_idx)
    bracket_indent = line_to_close  # the line is whitespace only
    insertion_lines = "\n".join(indent + fmt_weapon(w) + "," for w in filtered)
    new_src = (
        src[: last_nl + 1]
        + insertion_lines
        + "\n"
        + bracket_indent
        + src[close_idx:]
    )
    return new_src, len(filtered)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    src = FACTIONS_JS.read_text()
    melee = json.loads(MELEE_JSON.read_text())

    total_inserted = 0
    untouched_ops: list[str] = []
    for op_id, weapons in melee.items():
        if not weapons:
            continue
        src, n = insert_melee(src, op_id, weapons)
        total_inserted += n
        if n == 0:
            untouched_ops.append(op_id)

    if args.dry_run:
        print(f"[dry-run] would insert {total_inserted} melee weapon entries")
        if untouched_ops:
            print(f"[dry-run] {len(untouched_ops)} ops had no new entries (already merged or not found):")
            for o in untouched_ops[:20]:
                print(f"  - {o}")
            if len(untouched_ops) > 20:
                print(f"  ... and {len(untouched_ops) - 20} more")
        return

    FACTIONS_JS.write_text(src)
    print(f"Inserted {total_inserted} melee weapon entries into {FACTIONS_JS}")
    if untouched_ops:
        print(f"({len(untouched_ops)} ops had no new entries — already merged or op id missing)")


if __name__ == "__main__":
    main()
