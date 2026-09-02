import re

with open('index.html', 'r') as f:
    html = f.read()

# Replace hardcoded colors with CSS variables
color_map = {
    "'app-base': '#0D0D0D'": "'app-base': 'var(--app-base)'",
    "'surface-card': '#161616'": "'surface-card': 'var(--surface-card)'",
    "'surface-raised': '#202020'": "'surface-raised': 'var(--surface-raised)'",
    "'border-subtle': '#262626'": "'border-subtle': 'var(--border-subtle)'",
    "'border-prominent': '#383838'": "'border-prominent': 'var(--border-prominent)'",
    "'primary-lime': '#A8FF00'": "'primary-lime': 'var(--primary-lime)'",
    "'text-primary': '#F4F4F5'": "'text-primary': 'var(--text-primary)'",
    "'text-secondary': '#A1A1AA'": "'text-secondary': 'var(--text-secondary)'",
    "'text-tertiary': '#94949E'": "'text-tertiary': 'var(--text-tertiary)'",
    "'text-disabled': '#52525B'": "'text-disabled': 'var(--text-disabled)'",
    "'deep-black': '#0D0D0D'": "'deep-black': 'var(--app-base)'",
    "'charcoal': '#161616'": "'charcoal': 'var(--surface-card)'",
    "'slate': '#202020'": "'slate': 'var(--surface-raised)'",
    "'dark-divider': '#262626'": "'dark-divider': 'var(--border-subtle)'",
    "'accent': '#A8FF00'": "'accent': 'var(--primary-lime)'",
}

for old, new in color_map.items():
    html = html.replace(old, new)

# Add CSS variables to <style> block
light_vars = """
        html, html.dark {
            --app-base: #0D0D0D;
            --surface-card: #161616;
            --surface-raised: #202020;
            --border-subtle: #262626;
            --border-prominent: #383838;
            --primary-lime: #A8FF00;
            --text-primary: #F4F4F5;
            --text-secondary: #A1A1AA;
            --text-tertiary: #94949E;
            --text-disabled: #52525B;
        }
        
        html.light {
            --app-base: #F8FAFC;
            --surface-card: #FFFFFF;
            --surface-raised: #F1F5F9;
            --border-subtle: #E2E8F0;
            --border-prominent: #CBD5E1;
            --primary-lime: #84CC16;
            --text-primary: #0F172A;
            --text-secondary: #475569;
            --text-tertiary: #64748B;
            --text-disabled: #94A3B8;
        }
"""

html = re.sub(r'html, html\.dark \{', light_vars + r'\n        /* Keep old vars below */\n        html, html.dark {', html)

with open('index.html', 'w') as f:
    f.write(html)
