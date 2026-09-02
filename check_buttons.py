import os
import re

for root, _, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or 'dist' in root:
        continue
    for file in files:
        if file.endswith('.tsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
                
            # find all text directly inside <button> ... </button>
            # we can look for `<button[^>]*>([^<]+)</button>`
            # or simply `<button` and `</button>`
            
            matches = re.findall(r'<button[^>]*>\s*([^<]+)\s*</button>', content, re.IGNORECASE)
            for m in matches:
                m = m.strip()
                if not m:
                    continue
                # If it's a JSX expression like {variable} ignore
                if m.startswith('{') and m.endswith('}'):
                    continue
                if m[0].islower():
                    print(f"{filepath}: '{m}'")
