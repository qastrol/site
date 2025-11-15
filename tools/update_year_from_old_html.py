#!/usr/bin/env python3
"""
Set `year: 2024` in `js/table/alerts_table.js` for any alert whose
`code` also appears in `tools/alerts_old.html`.

Usage:
    python tools/update_year_from_old_html.py
"""
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML_PATH = ROOT / "tools" / "alerts_old.html"
JS_PATH = ROOT / "js" / "table" / "alerts_table.js"


def extract_codes_from_html(text):
    # HTML uses escaped angle brackets: &lt;code&gt;
    codes = set(re.findall(r'&lt;([^&>]+)&gt;', text))
    # return set with angle-brackets, matching JS format
    return {f"<{c}>" for c in codes}


def update_js(js_text, codes_set):
    # find array start
    start_marker = "const alertsTable = ["
    start_idx = js_text.find(start_marker)
    if start_idx == -1:
        raise RuntimeError("Could not find alerts table start marker in JS file")

    arr_start = js_text.find("[", start_idx)
    if arr_start == -1:
        raise RuntimeError("Could not find '[' after start marker")

    i = arr_start + 1
    n = len(js_text)
    out = [js_text[: arr_start + 1]]
    last = arr_start + 1
    modified = 0

    while i < n:
        ch = js_text[i]
        if ch == "{":
            out.append(js_text[last:i])
            start_obj = i
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
            end_obj = i
            obj = js_text[start_obj:end_obj]

            # find code value inside object
            m = re.search(r'code\s*:\s*"([^"]+)"', obj)
            if m:
                code_val = m.group(1)
                if code_val in codes_set:
                    # set year to 2024 (replace if exists, else insert)
                    if re.search(r'\byear\s*:', obj):
                        new_obj = re.sub(r'\byear\s*:\s*[^,}]*', 'year: 2024', obj)
                    else:
                        inner = obj[:-1].rstrip()
                        if inner.endswith(','):
                            new_inner = inner + ' year: 2024'
                        else:
                            new_inner = inner + ', year: 2024'
                        new_obj = new_inner + '}'
                    out.append(new_obj)
                    modified += 1
                else:
                    out.append(obj)
            else:
                out.append(obj)

            last = end_obj
            continue
        elif ch == "]":
            break
        i += 1

    out.append(js_text[last:])
    return ''.join(out), modified


def main():
    html = HTML_PATH.read_text(encoding="utf-8")
    codes = extract_codes_from_html(html)
    if not codes:
        print("No codes found in alerts_old.html")
        return

    js_text = JS_PATH.read_text(encoding="utf-8")
    new_js, modified = update_js(js_text, codes)
    if modified:
        JS_PATH.write_text(new_js, encoding="utf-8")
        print(f"Updated year for {modified} entries in {JS_PATH}")
    else:
        print("No matching codes found; no changes made.")


if __name__ == '__main__':
    main()
