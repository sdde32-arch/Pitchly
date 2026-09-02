import os
import re

replacements = {
    '\[#0D0D0D\]': 'app-base',
    '\[#161616\]': 'surface-card',
    '\[#202020\]': 'surface-raised',
    '\[#262626\]': 'border-subtle',
    '\[#A8FF00\]': 'primary-lime',
    '\[#F4F4F5\]': 'text-primary',
    '\[#A1A1AA\]': 'text-secondary',
    '\[#94949E\]': 'text-tertiary',
    '\[#52525B\]': 'text-disabled',
}

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    new_content = content
    for old, new in replacements.items():
        # Replace occurrences like bg-[#161616] with bg-surface-card
        # using regex to catch bg-, text-, border-, fill-, stroke-, etc.
        pattern = r'(bg-|text-|border-|fill-|stroke-|shadow-|from-|via-|to-|ring-|divide-|outline-|decoration-)' + old
        new_content = re.sub(pattern, r'\1' + new, new_content)
        
        # Also handle hover:, focus:, active:, dark:, etc.
        # This is already covered because pattern matches the prefix directly adjacent to [#...].
        
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, dirs, files in os.walk('.'):
    if 'node_modules' in root or '.git' in root or 'dist' in root:
        continue
    for file in files:
        if file.endswith(('.tsx', '.ts', '.jsx', '.js', '.html')):
            process_file(os.path.join(root, file))
