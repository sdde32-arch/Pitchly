import re

with open("components/Layout.tsx", "r") as f:
    content = f.read()

# Layout definition start
layout_comp_start = content.find("export const Layout: React.FC<LayoutProps> = ({ children }) => {")

imports_part = content[:layout_comp_start]

# We need to extract NavItem and DesktopNavItem from Layout body
nav_item_start = content.find("  const NavItem = ({")
nav_item_end = content.find("  const DesktopNavItem = ({")
if nav_item_start != -1 and nav_item_end != -1:
    nav_item = content[nav_item_start:nav_item_end]
else:
    nav_item = ""

desktop_nav_item_start = nav_item_end
desktop_nav_item_end = content.find("  // 2. Fetch notifications count", desktop_nav_item_start)
if desktop_nav_item_start != -1 and desktop_nav_item_end != -1:
    desktop_nav_item = content[desktop_nav_item_start:desktop_nav_item_end]
else:
    desktop_nav_item = ""

# Since these nested components use props from Layout scope (like `location`, `theme`, etc.), 
# we should either change them to functions or move them outside and pass all needed props.
# The easiest way is to rename them to render functions: `renderNavItem` and `renderDesktopNavItem`
# Let's check how they are invoked.
