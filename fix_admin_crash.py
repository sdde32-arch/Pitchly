import re

with open("pages/admin/TournamentManager.tsx", "r") as f:
    content = f.read()

# I need to completely remove the old share block and replace it with ShareTournamentCard in TournamentManager as well!
# Wait, let's just find the exact block and replace it.

old_block_regex = r'<div className="bg-surface-card rounded-2xl border border-border-subtle p-5 sm:p-6 mb-8 shadow-sm">.*?</div>\n          </div>\n        </div>'

# Let's check where it is
