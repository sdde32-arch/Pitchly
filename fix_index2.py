import re

with open('index.html', 'r') as f:
    html = f.read()

# Make sure --accent-text is present
html = html.replace('--text-disabled: #52525B;', '--text-disabled: #52525B;\n            --accent-text: #0D0D0D;')
html = html.replace('--text-disabled: #94A3B8;', '--text-disabled: #94A3B8;\n            --accent-text: #0D0D0D;')

with open('index.html', 'w') as f:
    f.write(html)
