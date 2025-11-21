#!/usr/bin/env python3
"""
Scan the `soundeffects/` folder for .mp3 files, measure duration (ms),
and insert/update a `length: <ms>` property for each matching entry in
`js/table/soundeffects_table.js`.

Usage:
  python tools/update_soundeffect_lengths.py [--dry-run]

Requirements:
  - Python 3.8+
  - Preferably `mutagen` (pip install mutagen) for reading mp3 durations.
    If mutagen is not available, the script will print instructions and exit.

The script makes a backup of the original JS file at
`js/table/soundeffects_table.js.bak` before modifying it.

Matching logic:
  - The script normalizes the table `name` values and the audio filenames
    by removing non-alphanumeric characters and lowercasing. Example:
      name "(airhorn)"  -> "airhorn"
      file "airhorn.mp3" -> "airhorn"

  - For each object in the `soundeffectsTable` array that contains a
    `name: "..."` property, the script will add or update a `length: <ms>`
    property inside that object.

Be careful and review the changes before committing.
"""

from __future__ import annotations
import os
import re
import sys
import argparse
from pathlib import Path

JS_PATH = Path("js/table/soundeffects_table.js")
SFX_DIR = Path("soundeffects")
BACKUP_SUFFIX = ".bak"


def normalize_key(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def get_mp3_durations(sfx_dir: Path):
    """Return mapping normalized_name -> duration_ms for .mp3 files found."""
    try:
        from mutagen.mp3 import MP3
    except Exception as e:
        print("Error: mutagen is required to read mp3 durations.")
        print("Install it with: pip install mutagen")
        raise

    mapping = {}
    if not sfx_dir.exists():
        print(f"Soundeffects directory not found: {sfx_dir}")
        return mapping

    for root, _, files in os.walk(sfx_dir):
        for fn in files:
            if not fn.lower().endswith('.mp3'):
                continue
            path = Path(root) / fn
            base = path.stem
            key = normalize_key(base)
            try:
                audio = MP3(path)
                length_s = float(audio.info.length)
                length_ms = int(round(length_s * 1000))
                mapping[key] = length_ms
            except Exception as exc:
                print(f"Failed to read {path}: {exc}")
    return mapping


def update_js_file(js_path: Path, durations: dict, dry_run: bool = False) -> tuple[int,int]:
    """Update or insert `length: <ms>` in objects inside soundeffects_table.js.

    Returns (updated_count, total_matched)
    """
    if not js_path.exists():
        raise FileNotFoundError(f"JS file not found: {js_path}")

    content = js_path.read_text(encoding='utf-8')

    # Extract the array body of soundeffectsTable for simpler searching
    arr_match = re.search(r"const\s+soundeffectsTable\s*=\s*\[", content)
    if not arr_match:
        raise RuntimeError("Could not find 'const soundeffectsTable = [' in JS file")

    # We'll find each object by locating the pattern: { ... name: "..." ... }
    # Use a regex that captures an object starting with '{' and containing name: "..."
    # and non-greedily continues until the next '\n\t},' or '\n];' etc.
    obj_re = re.compile(r"\{\s*name\s*:\s*\"(?P<name>.*?)\"(?P<body>.*?)\}(?=\s*,|\s*\n)", re.S)

    def replace_obj(m: re.Match) -> str:
        name = m.group('name')
        body = m.group('body')
        obj_text = m.group(0)
        key = normalize_key(name)
        matched = key in durations
        if not matched:
            return obj_text  # unchanged
        ms = durations[key]
        # Check if length property exists
        if re.search(r"\blength\s*:\s*[^,}\n]+", body):
            # replace existing length value
            new_body = re.sub(r"\blength\s*:\s*[^,}\n]+", f"length: {ms}", body)
            new_obj = "{" + f"name: \"{name}\"" + new_body + "}"
            return new_obj
        else:
            # insert length before the final close of object
            # attempt to preserve indentation: find last non-whitespace before final '}'
            # assemble: original up to just before '}', then add ', length: <ms>' then '}'
            # But body already starts with the rest after the name; we need to append length before closing brace
            # Simplest: if body.strip().endswith(',') then place ' length: <ms>' before final comma? safer to insert ', length: <ms>' before the '}'
            # Build new object by removing trailing spaces then inserting
            stripped = obj_text.rstrip()
            # find position of final '}' in obj_text
            # We'll remove the final '}' and append ', length: {ms}}' with same spacing
            # But ensure we don't introduce double commas
            # If the object already ends with a comma just before '}', avoid double comma
            # Example endings: '...\n\t},' or '...\n\t}'
            # We'll search backwards for the last non-space char before the final '}'
            # Find index of final '}' relative to obj_text
            last_brace_idx = obj_text.rfind('}')
            before = obj_text[:last_brace_idx]
            after = obj_text[last_brace_idx:]
            # Trim trailing whitespace from 'before'
            bt = before.rstrip()
            if bt.endswith(','):
                new_before = bt + f" length: {ms}"
            else:
                new_before = bt + f", length: {ms}"
            # Preserve whatever whitespace was between bt and '}' by capturing spaces in 'after'
            new_obj = new_before + after
            return new_obj

    new_content, n = obj_re.subn(replace_obj, content)

    # n is number of object matches attempted; but replace_obj only changes when key present
    # Count actual updates by diffing occurrences of 'length:' for keys
    updated_count = 0
    for k, ms in durations.items():
        # Build pattern to check presence of name followed by length: ms
        pat = re.compile(rf"name\s*:\s*\".*?\".*?length\s*:\s*{ms}", re.S)
        if pat.search(new_content):
            updated_count += 1

    # Make backup and write
    if updated_count > 0 and not dry_run:
        bak_path = js_path.with_suffix(js_path.suffix + BACKUP_SUFFIX)
        if not bak_path.exists():
            js_path.rename(bak_path)
            # write new content to original path
            js_path.write_text(new_content, encoding='utf-8')
        else:
            # if backup exists, create a timestamped backup
            import time
            ts = int(time.time())
            bak_path2 = js_path.with_name(js_path.name + f".{ts}.bak")
            js_path.rename(bak_path2)
            js_path.write_text(new_content, encoding='utf-8')
    elif dry_run:
        # just show counts
        pass

    return updated_count, len(durations)


def main(argv):
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true', help='Do not modify files; just report')
    args = parser.parse_args(argv)

    try:
        durations = get_mp3_durations(SFX_DIR)
    except Exception:
        print("Failed to gather mp3 durations. Make sure 'mutagen' is installed.")
        return 2

    if not durations:
        print("No mp3 files found or unable to read durations in", SFX_DIR)
        return 1

    print(f"Found {len(durations)} mp3 files. Updating {JS_PATH}...")
    try:
        updated, total = update_js_file(JS_PATH, durations, dry_run=args.dry_run)
        print(f"Updated {updated} entries (out of {total} available mp3 files).")
        if args.dry_run:
            print("(dry-run) No files were modified.")
    except Exception as e:
        print("Error while updating JS file:", e)
        return 3

    print("Done.")
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
