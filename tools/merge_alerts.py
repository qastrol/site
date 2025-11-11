import re
from html import unescape

alerts_html_path = r"c:\Users\Gebruiker\Downloads\alerts.html"
alerts_js_path = r"c:\Users\Gebruiker\Documents\GitHub\kerstknallers\js\table\alerts_table.js"

# Read HTML and extract rows
html = open(alerts_html_path, encoding='utf-8').read()

# Find all <tr>...</tr> blocks
rows = re.findall(r"<tr>(.*?)</tr>", html, re.S|re.I)

mapping = {}
for r in rows:
    # Find all <td>...</td>
    tds = re.findall(r"<td>(.*?)</td>", r, re.S|re.I)
    if len(tds) >= 3:
        name = re.sub(r"\s+"," ", tds[0].strip())
        desc = re.sub(r"\s+"," ", tds[1].strip())
        code_html = tds[2].strip()
        # code_html may be like &lt;code&gt; or &lt;code&gt;</td>
        m = re.search(r"&lt;([^&>]+)&gt;", code_html)
        if not m:
            m = re.search(r"<([^>]+)>", code_html)
        if m:
            code = m.group(1).strip()
            mapping[code.lower()] = (unescape(name), unescape(desc))

# Read alerts_table.js
js = open(alerts_js_path, encoding='utf-8').read()

# Replace placeholder entries: name starts with "Alert voor " and description starts with "Beschrijving voor "

def replace_entry(match):
    name = match.group('name')
    desc = match.group('desc')
    code = match.group('code')
    code_key = code.strip().strip('<>').lower()
    if code_key in mapping:
        new_name, new_desc = mapping[code_key]
        # escape double quotes and backslashes
        new_name_esc = new_name.replace('\\', '\\\\').replace('"', '\\"')
        new_desc_esc = new_desc.replace('\\', '\\\\').replace('"', '\\"')
        return '{ name: "' + new_name_esc + '", description: "' + new_desc_esc + '", code: "' + code + '" }'
    else:
        return match.group(0)

pattern = re.compile(r"\{\s*name:\s*\"(?P<name>Alert voor [^\"]+)\"\,\s*description:\s*\"(?P<desc>Beschrijving voor [^\"]+)\"\,\s*code:\s*\"(?P<code><[^\"]+>)\"\s*\}")
new_js = pattern.sub(replace_entry, js)

# Also replace entries where description is placeholder (in case name differs)
pattern2 = re.compile(r"\{\s*name:\s*\"(?P<name>[^\"]+)\"\,\s*description:\s*\"(?P<desc>Beschrijving voor [^\"]+)\"\,\s*code:\s*\"(?P<code><[^\"]+>)\"\s*\}")
new_js = pattern2.sub(replace_entry, new_js)

# Write to temp file
out_path = alerts_js_path + ".merged"
open(out_path, 'w', encoding='utf-8').write(new_js)
print(out_path)
print('--- MAPPED CODES ---')
for k,v in mapping.items():
    print(k, '=>', v[0])

# Print a small diff-like snippet for changed codes
for code, (n,d) in mapping.items():
    if code in js.lower():
        # find placeholder in js for this code
        if ('Alert voor ' + code) in js.lower() or ('Beschrijving voor ' + code) in js.lower():
            print('will replace', code)

print('Done')
