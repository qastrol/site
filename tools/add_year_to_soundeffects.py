import json
import re

# Codes uit de oude soundeffects.html (2024)
codes_2024 = [
    "(airhorn)", "(alweereenwinnaar)", "(augh)", "(biem)", "(bonk)", "(bruh)", 
    "(cave)", "(challenger)", "(creeper)", "(crickets)", "(cringe)", "(criticalhit)",
    "(crowbar)", "(damage)", "(disappointed)", "(door)", "(drink)", "(eat)", 
    "(enderman)", "(euroschreeuw)", "(failure)", "(fallguys)", "(fart)", "(finale)",
    "(gameover)", "(gas)", "(goeiemiddag)", "(heybuurman)", "(hiereeneuro)", "(intro)",
    "(join)", "(kloppen)", "(knolpower)", "(leave)", "(meow)", "(mosterd)", 
    "(oef)", "(opjemuil)", "(ping)", "(pipe)", "(rctlaugh)", "(rctscream)",
    "(scorn)", "(shock)", "(sinisterlaugh)", "(slimstemens)", "(sus)", "(taxonweb)",
    "(tickle)", "(tnt)", "(toilet)", "(twohours)", "(usb)", "(verdomme)",
    "(villager)", "(vineboom)", "(watgoed)", "(whip)", "(witch)", "(woef)",
    "(wow)", "(zombie)", "(ns)", "(boulevard)", "(hema)", "(missed)",
    "(ohmygod)", "(ah)", "(shutdown)", "(yup)", "(violin)", "(error)",
    "(punch)", "(wide)", "(wauw)", "(startup)", "(internet)", "(eendje)",
    "(fortnite)", "(illuminati)"
]

# Lees het soundeffects_table.js bestand
file_path = r"c:\Users\Gebruiker\Documents\GitHub\kerstknallers\js\table\soundeffects_table.js"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Zoek naar alle objecten in de array
# We gaan door elk object en voegen "year" toe als het er niet is
lines = content.split('\n')
new_lines = []
i = 0

while i < len(lines):
    line = lines[i]
    new_lines.append(line)
    
    # Check of deze regel een "code" bevat
    code_match = re.search(r'"code":\s*"(\([^"]+\))"', line)
    if code_match:
        code = code_match.group(1)
        
        # Kijk of de volgende regel al "year" bevat
        if i + 1 < len(lines):
            next_line = lines[i + 1]
            if '"year"' not in next_line:
                # Voeg year toe
                year = 2024 if code in codes_2024 else 2025
                
                # Bepaal de indentatie
                indent = re.match(r'^(\s*)', line).group(1)
                
                # Check of er een komma moet komen na de huidige regel
                if not line.rstrip().endswith(','):
                    # Voeg komma toe aan de vorige regel
                    new_lines[-1] = line.rstrip() + ','
                
                # Voeg year toe
                new_lines.append(f'{indent}"year": {year}')
    
    i += 1

# Schrijf terug
with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))

print("Year velden toegevoegd aan soundeffects_table.js")
