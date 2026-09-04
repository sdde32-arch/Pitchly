import re

with open('components/Logo.tsx', 'r') as f:
    content = f.read()

# Replace the motion.g wrapper around the main sphere to remove rotate
old_g = """        {/* 3. Floating Glowing Slime Football Sphere with 32-panel football print & smooth in-flight spin */}
        <motion.g
          animate={animated ? {
            rotate: [0, 360],
          } : undefined}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ transformOrigin: "24px 24px" }}
        >"""

new_g = """        {/* 3. Floating Glowing Slime Sphere */}
        <g>"""

# Also replace the closing </motion.g> for it, but wait, the closing tag is way down.
# It's better to just use regex to replace that specific motion.g.
content = content.replace(old_g, new_g)
content = content.replace("</motion.g>\n          {/* Crisp perimeter outline", "</g>\n          {/* Crisp perimeter outline")

with open('components/Logo.tsx', 'w') as f:
    f.write(content)
