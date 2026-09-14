import re

with open("pages/Home.tsx", "r") as f:
    content = f.read()

# 1. Remove showScrollTop state
content = re.sub(r'  const \[showScrollTop, setShowScrollTop\] = useState\(false\);\n', '', content)

# 2. Remove the scroll event listener useEffect
# It starts at "  // Scroll listener for back to top" and ends at "  // Close sort menu on click outside"
scroll_effect_regex = r'  // Scroll listener for back to top\n  useEffect\(\(\) => \{.*?\n  \}, \[\]\);\n\n'
content = re.sub(scroll_effect_regex, '', content, flags=re.DOTALL)

# 3. Remove the back to top button
# It starts with "          {/* BACK TO TOP FLOATING BUTTON */}" and ends at "</AnimatePresence>"
back_to_top_regex = r'          \{\/\* BACK TO TOP FLOATING BUTTON \*\/\}\n          <AnimatePresence>.*?          </AnimatePresence>\n'
content = re.sub(back_to_top_regex, '', content, flags=re.DOTALL)

# 4. Change motion.section to section, remove initial/whileInView/viewport/transition
content = content.replace("<motion.section", "<section")
content = content.replace("</motion.section>", "</section>")

# Remove animation props from the section
animation_props = r'                initial=\{\{ opacity: 0, y: 12 \}\}\n                whileInView=\{\{ opacity: 1, y: 0 \}\}\n                viewport=\{\{ once: true, margin: "-20px" \}\}\n                transition=\{\{ duration: 0\.35, ease: "easeOut" \}\}\n'
content = re.sub(animation_props, '', content)

with open("pages/Home.tsx", "w") as f:
    f.write(content)
