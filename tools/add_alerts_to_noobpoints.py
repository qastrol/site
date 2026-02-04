#!/usr/bin/env python3
"""
Add missing alert video entries to `js/table/noobpoints_table.js` for video files
found in the `alerts/` directory that already exist in `alerts_table.js` but are
missing in `noobpoints_table.js`.

The new entries copy as much as possible from the matching alerts entry:
- name
- description
- type
- category

The Noob-Points cost is calculated the same as the provided C# formula:
    redeemCost = round((durationMs / 4.0) / 10.0) * 10

Usage:
  python tools/add_alerts_to_noobpoints.py

Dependencies:
  - ffprobe (from FFmpeg) recommended for .mp4/.webm duration
  - Optional: mutagen (pip install mutagen) for .mp4/.mp3 fallback
"""
from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime
from typing import Dict, List, Optional

ROOT = os.path.dirname(os.path.dirname(__file__))
ALERTS_DIR = os.path.join(ROOT, "alerts")
ALERTS_TABLE_PATH = os.path.join(ROOT, "js", "table", "alerts_table.js")
NOOBPOINTS_TABLE_PATH = os.path.join(ROOT, "js", "table", "noobpoints_table.js")

VIDEO_EXTS = {".mp4", ".webm"}


class DurationError(RuntimeError):
    pass


def has_command(cmd: str) -> bool:
    from shutil import which

    return which(cmd) is not None


def ffprobe_duration_ms(path: str) -> Optional[int]:
    if not has_command("ffprobe"):
        return None
    try:
        out = subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=noprint_wrappers=1:nokey=1",
                path,
            ],
            stderr=subprocess.STDOUT,
            text=True,
        ).strip()
        if not out:
            return None
        duration_s = float(out)
        return int(round(duration_s * 1000))
    except Exception:
        return None


def mutagen_duration_ms(path: str) -> Optional[int]:
    try:
        import mutagen
    except Exception:
        return None

    try:
        audio = mutagen.File(path)
        if not audio or not getattr(audio, "info", None):
            return None
        length_s = getattr(audio.info, "length", None)
        if length_s is None:
            return None
        return int(round(length_s * 1000))
    except Exception:
        return None


def get_duration_ms(path: str) -> int:
    duration_ms = ffprobe_duration_ms(path)
    if duration_ms is not None:
        return duration_ms

    duration_ms = mutagen_duration_ms(path)
    if duration_ms is not None:
        return duration_ms

    raise DurationError(
        "Could not read duration. Install FFmpeg (ffprobe) or mutagen."
    )


def calc_redeem_cost(duration_ms: int) -> int:
    return int(round((duration_ms / 4.0) / 10.0) * 10)


def read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def extract_array_block(js: str, const_name: str) -> str:
    match = re.search(rf"const\s+{re.escape(const_name)}\s*=\s*\[", js)
    if not match:
        raise ValueError(f"Could not find array {const_name}")
    start = match.end() - 1

    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(js)):
        ch = js[i]
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
        else:
            if ch == '"':
                in_str = True
            elif ch == '[':
                depth += 1
            elif ch == ']':
                depth -= 1
                if depth == 0:
                    return js[start : i + 1]
    raise ValueError(f"Could not parse array {const_name}")


def extract_object_blocks(array_text: str) -> List[str]:
    blocks: List[str] = []
    in_str = False
    esc = False
    depth = 0
    obj_start = None

    for i, ch in enumerate(array_text):
        if in_str:
            if esc:
                esc = False
            elif ch == "\\":
                esc = True
            elif ch == '"':
                in_str = False
            continue

        if ch == '"':
            in_str = True
            continue

        if ch == '{':
            if depth == 0:
                obj_start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and obj_start is not None:
                blocks.append(array_text[obj_start : i + 1])
                obj_start = None

    return blocks


def parse_js_string_field(block: str, field: str) -> Optional[str]:
    m = re.search(rf"\b{re.escape(field)}\s*:\s*\"((?:\\\\.|[^\"])+)\"", block)
    if not m:
        return None
    raw = m.group(1)
    try:
        return bytes(raw, "utf-8").decode("unicode_escape")
    except Exception:
        return raw


def parse_js_array_field(block: str, field: str) -> List[str]:
    m = re.search(rf"\b{re.escape(field)}\s*:\s*\[(.*?)\]", block, re.DOTALL)
    if not m:
        return []
    inner = m.group(1)
    strings = re.findall(r'"((?:\\\\.|[^\"])*)"', inner)
    out: List[str] = []
    for s in strings:
        try:
            out.append(bytes(s, "utf-8").decode("unicode_escape"))
        except Exception:
            out.append(s)
    return out


def parse_alerts_table(js: str) -> Dict[str, Dict[str, object]]:
    array_text = extract_array_block(js, "alertsTable")
    blocks = extract_object_blocks(array_text)
    out: Dict[str, Dict[str, object]] = {}
    for b in blocks:
        code = parse_js_string_field(b, "code")
        if not code:
            continue
        norm_code = code.strip().strip("<>").strip()
        if not norm_code:
            continue
        out[norm_code] = {
            "name": parse_js_string_field(b, "name"),
            "description": parse_js_string_field(b, "description"),
            "type": parse_js_string_field(b, "type"),
            "category": parse_js_array_field(b, "category"),
        }
    return out


def parse_noobpoints_codes(js: str) -> List[str]:
    return re.findall(r'\bcode\s*:\s*"([^"]+)"', js)


def js_string(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def js_array(values: List[str]) -> str:
    return "[" + ", ".join(js_string(v) for v in values) + "]"


def make_entry(code: str, data: Dict[str, object], cost: int) -> str:
    name = data.get("name") or code
    description = data.get("description") or f"Beschrijving voor {name}"
    alert_type = data.get("type") or "Video-alert"
    category = data.get("category") or []

    return (
        f"\t{{ name: {js_string(name)}, code: {js_string(code)}, description: {js_string(description)}, "
        f"cost: {cost}, type: {js_string(alert_type)}, category: {js_array(list(category))} }}"
    )


def main() -> None:
    if not os.path.isdir(ALERTS_DIR):
        print(f"Alerts directory not found: {ALERTS_DIR}")
        sys.exit(1)
    if not os.path.isfile(ALERTS_TABLE_PATH):
        print(f"Alerts table not found: {ALERTS_TABLE_PATH}")
        sys.exit(1)
    if not os.path.isfile(NOOBPOINTS_TABLE_PATH):
        print(f"Noobpoints table not found: {NOOBPOINTS_TABLE_PATH}")
        sys.exit(1)

    alerts_js = read_text(ALERTS_TABLE_PATH)
    noob_js = read_text(NOOBPOINTS_TABLE_PATH)

    alerts_map = parse_alerts_table(alerts_js)
    existing_codes = set(c.strip() for c in parse_noobpoints_codes(noob_js))

    video_files = []
    for fn in os.listdir(ALERTS_DIR):
        ext = os.path.splitext(fn)[1].lower()
        if ext in VIDEO_EXTS:
            base = os.path.splitext(fn)[0]
            video_files.append((base, os.path.join(ALERTS_DIR, fn)))

    candidates = [
        (code, path)
        for code, path in video_files
        if code in alerts_map and code not in existing_codes
    ]

    if not candidates:
        print("No missing alert videos found. Nothing to do.")
        return

    entries: List[str] = []
    missing_duration = []

    for code, path in sorted(candidates, key=lambda x: x[0].lower()):
        try:
            duration_ms = get_duration_ms(path)
        except DurationError as e:
            missing_duration.append((code, path, str(e)))
            continue

        cost = calc_redeem_cost(duration_ms)
        entry = make_entry(code, alerts_map.get(code, {}), cost)
        entries.append(entry)

    if missing_duration:
        print("Could not determine duration for some files:")
        for code, path, err in missing_duration:
            print(f" - {code}: {path} ({err})")
        print("Install FFmpeg (ffprobe) or mutagen, then re-run.")
        if not entries:
            sys.exit(2)

    if not entries:
        print("No entries generated. Nothing to write.")
        return

    # Backup
    bak_path = NOOBPOINTS_TABLE_PATH + ".bak." + datetime.now().strftime("%Y%m%d%H%M%S")
    shutil.copy2(NOOBPOINTS_TABLE_PATH, bak_path)
    print(f"Backup created: {bak_path}")

    # Insert entries before closing '];'
    idx = noob_js.rfind("];")
    if idx == -1:
        print("Could not find closing '];' in noobpoints table. Aborting.")
        sys.exit(1)

    before = noob_js[:idx].rstrip()
    after = noob_js[idx:]

    need_comma = not before.endswith(",")
    prefix = ",\n" if need_comma else "\n"

    new_content = before + prefix + ",\n".join(entries) + "\n" + after

    with open(NOOBPOINTS_TABLE_PATH, "w", encoding="utf-8") as f:
        f.write(new_content)

    print(f"Appended {len(entries)} entries to {NOOBPOINTS_TABLE_PATH}")
    for entry in entries:
        print(" - " + entry.split("code:", 1)[1].split(",", 1)[0].strip())


if __name__ == "__main__":
    main()
