import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = re.sub(r'\btext-app-base\b', 'text-accent-text', content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or 'dist' in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
            process_file(os.path.join(root, file))
