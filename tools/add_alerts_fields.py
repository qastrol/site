#!/usr/bin/env python3
"""
Add missing fields `category`, `type` and `year` to each entry in
`js/table/alerts_table.js`. If a field already exists it is left alone.
The script is idempotent and preserves existing formatting as much as
possible.

Usage:
  python tools\add_alerts_fields.py
"""
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
JS_PATH = ROOT / "js" / "table" / "alerts_table.js"


def main():
    txt = JS_PATH.read_text(encoding="utf-8")

    start_marker = "const alertsTable = ["
    start_idx = txt.find(start_marker)
    if start_idx == -1:
        print("Could not find alerts table start marker.")
        return
    arr_start = txt.find("[", start_idx)
    if arr_start == -1:
        print("Could not find '[' after start marker.")
        return

    # find the closing bracket of the array (first '];' after arr_start)
    arr_end = txt.find("]", arr_start)
    if arr_end == -1:
        print("Could not find end of array.")
        return

    # We'll parse objects by scanning for balanced braces from arr_start+1
    i = arr_start + 1
    modified = 0
    # Start `out` with everything up to and including the opening '[' so
    # we preserve file header and the `const alertsTable = [` marker.
    out = [txt[: arr_start + 1]]
    last = arr_start + 1
    n = len(txt)

    while i < n:
        ch = txt[i]
        if ch == "{":
            # append the slice before this object
            out.append(txt[last:i])
            start_obj = i
            depth = 1
            i += 1
            while i < n and depth > 0:
                if txt[i] == "\"":
                    # skip string literal
                    j = i + 1
                    while j < n:
                        if txt[j] == "\\":
                            j += 2
                            continue
                        if txt[j] == "\"":
                            j += 1
                            break
                        j += 1
                    i = j
                    continue
                if txt[i] == "{":
                    depth += 1
                elif txt[i] == "}":
                    depth -= 1
                i += 1
            end_obj = i  # one past closing brace
            obj = txt[start_obj:end_obj]

            # Check whether fields already exist
            has_category = re.search(r"\bcategory\s*:", obj)
            has_type = re.search(r"\btype\s*:", obj)
            has_year = re.search(r"\byear\s*:", obj)

            additions = []
            if not has_category:
                additions.append('category: ""')
            if not has_type:
                additions.append('type: ""')
            if not has_year:
                additions.append('year: ""')

            if additions:
                # insert additions before final closing brace
                # try to preserve spacing: remove trailing whitespace before '}'
                inner = obj[:-1].rstrip()
                if inner.endswith(','):
                    new_inner = inner + ' ' + ', '.join(additions)
                else:
                    new_inner = inner + ', ' + ', '.join(additions)
                new_obj = new_inner + '}'
                out.append(new_obj)
                modified += 1
            else:
                out.append(obj)

            last = end_obj
            continue
        elif ch == "]":
            # end of array reached; append the rest and stop
            break
        i += 1

    # append remainder from last to end (including closing bracket and rest)
    out.append(txt[last:])

    if modified:
        new_txt = ''.join(out)
        JS_PATH.write_text(new_txt, encoding="utf-8")
        print(f"Updated {modified} entries in {JS_PATH}")
    else:
        print("No updates needed; all entries already have fields.")


if __name__ == '__main__':
    main()
