import re

with open("pages/tournament/TournamentHub.tsx", "r") as f:
    text = f.read()

# Import Settings
if "import { Settings" not in text:
    text = text.replace("import { Share2", "import { Share2, Settings")

# Find the header element
header_regex = r'(<div className="max-w-4xl mx-auto flex items-center justify-between gap-3">\s*<div.*?</Logo>.*?</span>\s*</div>\s*)<div className="flex items-center gap-2">'
# Replace only this occurrence
header_replace = r'\1<div className="flex items-center gap-2">\n            <button onClick={() => navigate("/admin/tournaments")} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-surface-card border border-border-subtle rounded-lg text-xs font-bold text-text-primary hover:bg-surface-raised transition-all cursor-pointer"><Settings size={14}/> <span>Manage</span></button>'

text = re.sub(header_regex, header_replace, text, count=1, flags=re.DOTALL)

with open("pages/tournament/TournamentHub.tsx", "w") as f:
    f.write(text)
