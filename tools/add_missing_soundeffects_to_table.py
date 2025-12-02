#!/usr/bin/env python3
"""
Add missing soundeffect entries to `js/table/soundeffects_table.js` for .mp3 files
found in the `soundeffects/` directory. The script uses the MP3 file length (ms)
and fills `name` and `description` with placeholders. It creates a backup of
the JS file before modifying it.

Usage:
  python tools/add_missing_soundeffects_to_table.py

Dependencies:
  pip install mutagen

"""
import os
import re
import shutil
import sys
from datetime import datetime

ROOT = os.path.dirname(os.path.dirname(__file__))
SOUNDEFFECTS_DIR = os.path.join(ROOT, "soundeffects")
JS_TABLE_PATH = os.path.join(ROOT, "js", "table", "soundeffects_table.js")

try:
    from mutagen.mp3 import MP3
except Exception:
    print("Missing dependency: mutagen. Install with: pip install mutagen")
    sys.exit(2)


def get_existing_codes(js_content):
    # find all code values: "code": "(...)", and normalize by removing
    # surrounding parentheses if present
    codes = re.findall(r'"code"\s*:\s*"([^"]+)"', js_content)
    norm = set()
    for c in codes:
        s = c.strip()
        if s.startswith('(') and s.endswith(')'):
            s = s[1:-1]
        norm.add(s)
    return norm


def mp3_length_ms(path):
    a = MP3(path)
    length_s = getattr(a.info, 'length', None)
    if length_s is None:
        return 0
    return int(round(length_s * 1000))


def make_js_entry(filename, length_ms):
    # filename is without extension, e.g. airhorn
    code = f"({filename})"
    name = f"{filename}"
    description = "Nog geen beschrijving"
    entry = (
        '    {\n'
        f'        "name": "{name}",\n'
        f'        "description": "{description}",\n'
        '        "category": [],\n'
        f'        "length": {length_ms},\n'
        f'        "code": "{code}"\n'
        '    }'
    )
    return entry


def main():
    if not os.path.isdir(SOUNDEFFECTS_DIR):
        print(f"Soundeffects directory not found: {SOUNDEFFECTS_DIR}")
        sys.exit(1)

    if not os.path.isfile(JS_TABLE_PATH):
        print(f"JS table file not found: {JS_TABLE_PATH}")
        sys.exit(1)

    with open(JS_TABLE_PATH, 'r', encoding='utf-8') as f:
        js_content = f.read()

    existing = get_existing_codes(js_content)

    mp3_files = [f for f in os.listdir(SOUNDEFFECTS_DIR) if f.lower().endswith('.mp3')]
    mp3_basenames = [os.path.splitext(f)[0] for f in mp3_files]

    missing = [b for b in mp3_basenames if b not in existing]

    if not missing:
        print("No missing soundeffects found. Nothing to do.")
        return

    print(f"Found {len(missing)} missing soundeffect(s): {', '.join(missing)}")

    entries = []
    for name in sorted(missing):
        path = os.path.join(SOUNDEFFECTS_DIR, name + '.mp3')
        try:
            length_ms = mp3_length_ms(path)
        except Exception as e:
            print(f"Warning: could not read length for {path}: {e}")
            length_ms = 0
        entries.append(make_js_entry(name, length_ms))

    entries_js = ',\n'.join(entries)

    # Prepare backup
    bak_path = JS_TABLE_PATH + '.bak.' + datetime.now().strftime('%Y%m%d%H%M%S')
    shutil.copy2(JS_TABLE_PATH, bak_path)
    print(f"Backup created: {bak_path}")

    # Insert entries before the final closing '];'
    idx = js_content.rfind('];')
    if idx == -1:
        print("Could not find closing '];' in JS file. Aborting.")
        sys.exit(1)

    before = js_content[:idx].rstrip()
    after = js_content[idx:]

    # Determine whether we need to insert an extra comma
    need_comma = not before.endswith(',')
    prefix = ',\n' if need_comma else '\n'

    new_content = before + prefix + entries_js + '\n' + after

    with open(JS_TABLE_PATH, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Appended {len(entries)} entries to {JS_TABLE_PATH}")
    for name in sorted(missing):
        print(f" - {name}.mp3 -> ({name})")


if __name__ == '__main__':
    main()
