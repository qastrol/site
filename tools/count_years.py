import re

content = open('js/table/soundeffects_table.js', 'r', encoding='utf-8').read()
year_2024 = len(re.findall(r'"year":\s*2024', content))
year_2025 = len(re.findall(r'"year":\s*2025', content))
total_entries = len(re.findall(r'"code":', content))

print(f'Soundeffects met year 2024: {year_2024}')
print(f'Soundeffects met year 2025: {year_2025}')
print(f'Totaal entries: {total_entries}')
print(f'Entries zonder year: {total_entries - year_2024 - year_2025}')
