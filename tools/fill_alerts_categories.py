import re
from pathlib import Path

JS_PATH = Path(__file__).resolve().parents[1] / 'js' / 'table' / 'alerts_table.js'

def extract_existing_categories_types(text):
    categories = set()
    types = set()
    for m in re.finditer(r"category:\s*\[([^\]]*)\]", text):
        items = m.group(1)
        for it in re.findall(r'"([^"]+)"', items):
            categories.add(it)
    for m in re.finditer(r"type:\s*\"([^\"]*)\"", text):
        types.add(m.group(1))
    return sorted(categories), sorted(t for t in types if t)

def predict_category_type(name, description, existing_categories, existing_types):
    n = (name or '') + ' ' + (description or '')
    s = n.lower()

    # Simple keyword-based heuristics mapped to existing categories/types
    mapping_categories = [
        (['minecraft','mario','zelda','pokemon','pokemon','peg','halo','game','gta','peggle','among us','amongus','nintend','morshu','gameboy','oblivion','runescape','mariokart','pokemondans'], 'Gaming'),
        (['tv','samson','spongebob','npo','wwe','kro-ncrv','man bijt hond','domino day','domino','tros','televisie','bioscoop'], 'TV'),
        (['meme','noice','gigachad','sus','memes','morshu','free real estate','its free real estate'], 'Meme'),
        (['muziek','song','music','dance','reinhard','another brick','noobbewaarder','samson','gert','griddy','vis'], 'Muziek-alert'),
        (['sound','geluid','audio','bbc sounds','geluidseffect','soundeffect','audio-alert','tune','theme'], 'Audio'),
        (['twitch','followmode','vip','timeout','hot potato','lingo','poker','interactieve','play it forward','playitforward'], 'Twitch'),
        (['film','bioscoop','movie','film'], 'Film'),
        (['computer','windows','media player','windows xp','windows 95','dvd','book','computer'], 'Computer'),
        (['qastrol','qastrol direct','qastrol moment','qastrolmic','qastrol'], 'Qastrol'),
        (['fryslan','friesland','fryslan'], 'Fryslân'),
        (['sport','voetbal','goals','euro','van gaal','vangaal','voetbal'], 'Sport'),
        (['internet','youtube','youtube 2007','youtube 2007 tutorial','giphy','netflix','ollama','gemini'], 'Internet'),
        (['dagelijks','daily','dagelijks leven'], 'Dagelijks leven'),
        (['belgië','belgie','belg'], 'België'),
        (['duitsland','germany','deutsch','deutschland'], 'Duitsland'),
        (['lord wout','wout','lordwout'], 'Lord Wout'),
        (['ai','artificial intelligence','ai qastrol','ollama','gemini','google gemini','black mesa','bmas'], 'AI'),
    ]

    # choose category
    chosen_category = None
    for keywords, cat in mapping_categories:
        for kw in keywords:
            if kw in s:
                if cat in existing_categories:
                    chosen_category = cat
                    break
        if chosen_category:
            break

    # choose type based on category or keywords
    chosen_type = None
    if chosen_category in ('Gaming','TV','Film','Meme','Qastrol','Internet','Fryslân','Sport','Dagelijks life','Lord Wout','Computer'):
        if 'Video-alert' in existing_types:
            chosen_type = 'Video-alert'
    if chosen_category == 'Audio' and 'Audio-alert' in existing_types:
        chosen_type = 'Audio-alert'
    if chosen_category == 'Twitch' and 'Interactieve alert' in existing_types:
        chosen_type = 'Interactieve alert'

    # fallback: keyword-based type
    if not chosen_type:
        if any(k in s for k in ['sound','geluid','audio','tune','theme','bbc sounds']):
            if 'Audio-alert' in existing_types:
                chosen_type = 'Audio-alert'
        if any(k in s for k in ['play','speel','hot potato','lingo','poker','timeout','vip','followmode']):
            if 'Interactieve alert' in existing_types:
                chosen_type = 'Interactieve alert'
    if not chosen_type and 'Video-alert' in existing_types:
        chosen_type = 'Video-alert'

    # final safe check: ensure chosen values exist in lists
    if chosen_category and chosen_category not in existing_categories:
        chosen_category = None
    if chosen_type and chosen_type not in existing_types:
        chosen_type = None

    return chosen_category, chosen_type


def main():
    text = JS_PATH.read_text(encoding='utf-8')
    existing_categories, existing_types = extract_existing_categories_types(text)
    print('Found categories:', existing_categories)
    print('Found types:', existing_types)

    # regex to capture each object block
    pattern = re.compile(r"\{\s*name:\s*\"(?P<name>[^\"]+)\"(?P<body>.*?\})(\s*,)?", re.DOTALL)
    changed = 0
    new_text = text

    for m in pattern.finditer(text):
        name = m.group('name')
        body = m.group('body')
        # extract description
        desc_m = re.search(r"description:\s*\"([^\"]*)\"", body)
        description = desc_m.group(1) if desc_m else ''
        # find category and type within body
        cat_m = re.search(r"category:\s*(\[[^\]]*\]|\"\")", body)
        type_m = re.search(r"type:\s*\"([^\"]*)\"|type:\s*\"\"", body)
        if not cat_m:
            continue
        cat_raw = cat_m.group(1)
        type_raw = None
        tm = re.search(r"type:\s*\"([^\"]*)\"", body)
        if tm:
            type_raw = tm.group(1)
        else:
            # detect explicit empty
            type_empty = re.search(r"type:\s*\"\"", body)
            type_raw = '' if type_empty else None

        # only work on empty category or empty type
        if (cat_raw.strip() == '""' or cat_raw.strip() == '') or (type_raw == ''):
            chosen_cat, chosen_type = predict_category_type(name, description, existing_categories, existing_types)
            repl_cat = None
            repl_type = None
            if cat_raw.strip() == '""' and chosen_cat:
                repl_cat = f'["{chosen_cat}"]'
            if type_raw == '' and chosen_type:
                repl_type = f'"{chosen_type}"'

            if repl_cat or repl_type:
                new_block = body
                if repl_cat:
                    new_block = re.sub(r"category:\s*\"\"", f"category: {repl_cat}", new_block)
                if repl_type:
                    new_block = re.sub(r"type:\s*\"\"", f"type: {repl_type}", new_block)
                # replace only this block occurrence
                new_text = new_text.replace(body, new_block, 1)
                changed += 1

    if changed:
        backup = JS_PATH.with_suffix('.js.bak')
        backup.write_text(text, encoding='utf-8')
        JS_PATH.write_text(new_text, encoding='utf-8')
        print(f'Updated {changed} entries. Backup saved to {backup.name}')
    else:
        print('No changes made.')

if __name__ == '__main__':
    main()
