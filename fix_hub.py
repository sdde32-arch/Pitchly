import re

with open("pages/tournament/TournamentHub.tsx", "r") as f:
    text = f.read()

# Add a button in the header
# Find: <div className="flex items-center gap-2">
# Replace with: <div className="flex items-center gap-2">\n            <button onClick={() => navigate("/admin/tournaments")} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-surface-card border border-border-subtle rounded-lg text-xs font-bold text-text-primary hover:bg-surface-raised transition-all cursor-pointer"><Settings size={14}/> <span>Manage</span></button>

text = text.replace('<div className="flex items-center gap-2">', '<div className="flex items-center gap-2">\n            <button onClick={() => navigate("/admin/tournaments")} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-surface-card border border-border-subtle rounded-lg text-xs font-bold text-text-primary hover:bg-surface-raised transition-all cursor-pointer"><Settings size={14}/> <span>Manage</span></button>')

# Add Settings import if not present
if "import { Settings" not in text:
    text = text.replace("import { Share2, Clock, ", "import { Share2, Clock, Settings, ")
    if "Settings" not in text:
        text = text.replace("import { Clock", "import { Clock, Settings")

with open("pages/tournament/TournamentHub.tsx", "w") as f:
    f.write(text)
