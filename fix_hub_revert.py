import re

with open("pages/tournament/TournamentHub.tsx", "r") as f:
    text = f.read()

# I will replace the bad button back to the div
bad_button = '<div className="flex items-center gap-2">\n            <button onClick={() => navigate("/admin/tournaments")} className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-surface-card border border-border-subtle rounded-lg text-xs font-bold text-text-primary hover:bg-surface-raised transition-all cursor-pointer"><Settings size={14}/> <span>Manage</span></button>'
text = text.replace(bad_button, '<div className="flex items-center gap-2">')

with open("pages/tournament/TournamentHub.tsx", "w") as f:
    f.write(text)
