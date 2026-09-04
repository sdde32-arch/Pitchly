import re

with open('components/Logo.tsx', 'r') as f:
    content = f.read()

old_svg_pattern = r'<svg\s+viewBox="0 0 48 48".*?<\/svg>'

new_svg = """<svg
        viewBox="0 0 48 48"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="24" cy="24" r="17.5" fill="#58CC02" />
      </svg>"""

content = re.sub(old_svg_pattern, new_svg, content, flags=re.DOTALL)

with open('components/Logo.tsx', 'w') as f:
    f.write(content)
