import re

with open('components/Logo.tsx', 'r') as f:
    content = f.read()

# We want to remove the <g> block for seams and <g> block for pentagons
# Regex to match the seams group
content = re.sub(r'\{\/\* Connecting Seams forming hexagonal panels \*\/.*?<\/g>', '', content, flags=re.DOTALL)
# Regex to match the pentagons group
content = re.sub(r'\{\/\* Iconic Dark Obsidian Pentagon Patches \*\/.*?<\/g>', '', content, flags=re.DOTALL)

with open('components/Logo.tsx', 'w') as f:
    f.write(content)
