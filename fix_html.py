import re

with open('index.html', 'r') as f:
    html = f.read()

# Replace the hardcoded background and color in the old html, html.dark rule
html = html.replace('background-color: #0D0D0D;', 'background-color: var(--app-base);')
html = html.replace('color: #F4F4F5;', 'color: var(--text-primary);')

# Let's also add the rgb versions for the old variables to html.light
light_rgb = """
        html.light {
            --color-bg: 248 250 252;
            --color-surface: 255 255 255;
            --color-surface-elevated: 241 245 249;
            --color-soft-card: 255 255 255; 
            --color-border: #E2E8F0;
            --color-border-light: #E2E8F0;
            --color-text-primary: 15 23 42;
            --color-text-secondary: 71 85 105; 
            --color-text-inverse: 248 250 252;
            --color-text-inverse-muted: 203 213 225; 
            --color-text-muted: 100 116 139; 
            --color-text-disabled: 148 163 184; 
            --color-icon-primary: 15 23 42;
            --color-icon-secondary: 71 85 105;
            --color-accent: 132 204 22;
            --color-accent-hover: 101 163 13; 
            --color-accent-text: 248 250 252;
        }
"""
# insert it before "/* Keep old vars below */"
html = html.replace('/* Keep old vars below */', light_rgb + '\n        /* Keep old vars below */')

with open('index.html', 'w') as f:
    f.write(html)
