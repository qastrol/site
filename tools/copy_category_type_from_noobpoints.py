#!/usr/bin/env python3
"""
Copy `category` and `type` from `js/table/noobpoints_table.js` to
`js/table/alerts_table.js` for entries that share the same `code` (ignoring
the angle brackets in alerts).

Usage:
  python tools/copy_category_type_from_noobpoints.py
"""
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NOOB_PATH = ROOT / "js" / "table" / "noobpoints_table.js"
ALERTS_PATH = ROOT / "js" / "table" / "alerts_table.js"


def parse_objects(js_text):
    """Yield object text slices from a JS array file (scans balanced braces)."""
    start_marker = "["
    arr_start = js_text.find(start_marker)
    if arr_start == -1:
        return []
    i = arr_start + 1
    n = len(js_text)
    objs = []
    while i < n:
        if js_text[i] == "{":
            start = i
            depth = 1
            i += 1
            while i < n and depth > 0:
                if js_text[i] == '"':
                    # skip string
                    j = i + 1
                    while j < n:
                        if js_text[j] == "\\":
                            j += 2
                            continue
                        if js_text[j] == '"':
                            j += 1
                            break
                        j += 1
                    i = j
                    continue
                if js_text[i] == "{":
                    depth += 1
                elif js_text[i] == "}":
                    depth -= 1
                i += 1
            end = i
            objs.append(js_text[start:end])
            continue
        i += 1
    return objs


def build_noob_map(noob_text):
    objs = parse_objects(noob_text)
    mapping = {}
    for obj in objs:
        m_code = re.search(r'code\s*:\s*"([^"]+)"', obj)
        if not m_code:
            continue
        code = m_code.group(1)
        m_type = re.search(r'type\s*:\s*"([^"]+)"', obj)
        m_cat = re.search(r'category\s*:\s*\[([^\]]*)\]', obj)
        type_val = m_type.group(1) if m_type else None
        if m_cat:
            cat_inner = m_cat.group(1).strip()
            category_literal = '[' + cat_inner + ']'
        else:
            category_literal = None
        mapping[code] = {
            'type': type_val,
            'category_literal': category_literal,
        }
    return mapping


def update_alerts(alerts_text, noob_map):
    start_marker = "const alertsTable = ["
    start_idx = alerts_text.find(start_marker)
    if start_idx == -1:
        raise RuntimeError("alerts array marker not found")
    arr_start = alerts_text.find("[", start_idx)
    i = arr_start + 1
    n = len(alerts_text)
    out = [alerts_text[: arr_start + 1]]
    last = arr_start + 1
    modified = 0

    while i < n:
        ch = alerts_text[i]
        if ch == "{":
            out.append(alerts_text[last:i])
            start_obj = i
            depth = 1
            i += 1
            while i < n and depth > 0:
                if alerts_text[i] == '"':
                    j = i + 1
                    while j < n:
                        if alerts_text[j] == "\\":
                            j += 2
                            continue
                        if alerts_text[j] == '"':
                            j += 1
                            break
                        j += 1
                    i = j
                    continue
                if alerts_text[i] == "{":
                    depth += 1
                elif alerts_text[i] == "}":
                    depth -= 1
                i += 1
            end_obj = i
            obj = alerts_text[start_obj:end_obj]

            # find alerts code (inside angle brackets)
            m_code = re.search(r'code\s*:\s*"<([^\"]+)>"', obj)
            if not m_code:
                out.append(obj)
                last = end_obj
                continue
            code = m_code.group(1)
            if code in noob_map:
                info = noob_map[code]
                new_obj = obj
                # type: replace or insert
                if info.get('type'):
                    if re.search(r'\btype\s*:', new_obj):
                        new_obj = re.sub(r'\btype\s*:\s*[^,}]*', f'type: "{info["type"]}"', new_obj)
                    else:
                        inner = new_obj[:-1].rstrip()
                        if inner.endswith(','):
                            new_inner = inner + ' type: "' + info['type'] + '"'
                        else:
                            new_inner = inner + ', type: "' + info['type'] + '"'
                        new_obj = new_inner + '}'
                # category: replace or insert (use the literal from noob)
                if info.get('category_literal'):
                    if re.search(r'\bcategory\s*:', new_obj):
                        new_obj = re.sub(r'\bcategory\s*:\s*[^,}]*', f'category: {info["category_literal"]}', new_obj)
                    else:
                        inner = new_obj[:-1].rstrip()
                        if inner.endswith(','):
                            new_inner = inner + ' category: ' + info['category_literal']
                        else:
                            new_inner = inner + ', category: ' + info['category_literal']
                        new_obj = new_inner + '}'

                out.append(new_obj)
                modified += 1
            else:
                out.append(obj)

            last = end_obj
            continue
        elif ch == "]":
            break
        i += 1

    out.append(alerts_text[last:])
    return ''.join(out), modified


def main():
    noob_text = NOOB_PATH.read_text(encoding='utf-8')
    noob_map = build_noob_map(noob_text)
    if not noob_map:
        print('No entries found in noobpoints table.')
        return

    alerts_text = ALERTS_PATH.read_text(encoding='utf-8')
    new_alerts, modified = update_alerts(alerts_text, noob_map)
    if modified:
        ALERTS_PATH.write_text(new_alerts, encoding='utf-8')
        print(f'Updated category/type for {modified} alerts in {ALERTS_PATH}')
    else:
        print('No matching codes found; no changes made.')


if __name__ == '__main__':
    main()
