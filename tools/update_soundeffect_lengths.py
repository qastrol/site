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
import shutil
from datetime import datetime
from pathlib import Path

JS_PATH = Path("js/table/soundeffects_table.js")
SFX_DIR = Path("soundeffects")
BACKUP_SUFFIX = ".bak"


def normalize_key(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


def get_mp3_durations(sfx_dir: Path):
    """Return mapping basename -> duration_ms for .mp3 files found.

    Uses the MP3 filename (without extension) as the key. This matches the
    convention where a JS entry's `code` value (without surrounding
    parentheses) equals the mp3 filename.
    """
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
            key = base  # use raw basename: e.g. 'airhorn'
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

    Matching uses the object's `code` field (if present). If `code` is like
    "(airhorn)", the parentheses are stripped and compared to mp3 basenames.

    Returns (updated_count, total_matched)
    """
    if not js_path.exists():
        raise FileNotFoundError(f"JS file not found: {js_path}")

    content = js_path.read_text(encoding='utf-8')

    # Find each object inside the array and process individually so we can
    # match on the object's `code` field (preferred) or fallback to `name`.
    obj_re = re.compile(r"\{(?P<obj>.*?)\}(?=\s*,|\s*\n)", re.S)

    new_parts = []
    last_end = 0
    updated_count = 0
    total_matched = 0

    for m in obj_re.finditer(content):
        start, end = m.span()
        obj_text = m.group(0)
        obj_body = m.group('obj')

        # find code field
        code_match = re.search(r'["\']?code["\']?\s*:\s*["\'](?P<code>[^"\']+)["\']', obj_body)
        key = None
        if code_match:
            code_val = code_match.group('code').strip()
            # strip surrounding parentheses
            if code_val.startswith('(') and code_val.endswith(')'):
                code_val = code_val[1:-1]
            key = code_val
        else:
            # fallback to name field
            name_match = re.search(r'["\']?name["\']?\s*:\s*["\'](?P<name>[^"\']+)["\']', obj_body)
            if name_match:
                # normalize name similarly to previous behavior
                key = normalize_key(name_match.group('name'))

        # Append unchanged chunk before this object
        new_parts.append(content[last_end:start])

        if key is None:
            # no key to match; leave object unchanged
            new_parts.append(obj_text)
            last_end = end
            continue

        # Determine if this object corresponds to a file we have duration for
        matched = key in durations
        # If we didn't find by exact code filename, also try normalized name lookup
        if not matched:
            alt_key = normalize_key(key)
            if alt_key in durations:
                key = alt_key
                matched = True

        if not matched:
            new_parts.append(obj_text)
            last_end = end
            continue

        total_matched += 1
        ms = durations[key]

        # Check for existing length property
        if re.search(r'["\']?length["\']?\s*:\s*\d+', obj_body):
            # replace the existing length number using a callable replacement
            def repl(m):
                return m.group(1) + str(ms)

            new_obj_text = re.sub(r'(["\']?length["\']?\s*:\s*)(\d+)', repl, obj_text)
            if new_obj_text != obj_text:
                updated_count += 1
            new_parts.append(new_obj_text)
        else:
            # insert length before the final '}' of the object
            last_brace_idx = obj_text.rfind('}')
            before = obj_text[:last_brace_idx]
            after = obj_text[last_brace_idx:]
            bt = before.rstrip()
            # determine indentation for the inserted line by examining last line
            nl = before.rfind('\n')
            indent = ''
            if nl != -1:
                line = before[nl+1:]
                m_ind = re.match(r'(\s*)', line)
                indent = m_ind.group(1)

            if bt.endswith(','):
                new_before = bt + f"\n{indent}\"length\": {ms}"
            else:
                new_before = bt + f",\n{indent}\"length\": {ms}"

            new_obj = new_before + '\n' + after
            updated_count += 1
            new_parts.append(new_obj)

        last_end = end

    # Append remainder
    new_parts.append(content[last_end:])
    new_content = ''.join(new_parts)

    # Make backup and write
    if updated_count > 0 and not dry_run:
        ts = int(datetime.now().timestamp())
        bak_path = js_path.with_name(js_path.name + f".{ts}.bak")
        shutil.copy2(js_path, bak_path)
        js_path.write_text(new_content, encoding='utf-8')
        print(f"Backup written to: {bak_path}")
    elif dry_run:
        # dry-run: do not modify file
        pass

    return updated_count, total_matched


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
