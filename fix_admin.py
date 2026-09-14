import re

with open("pages/admin/TournamentManager.tsx", "r") as f:
    content = f.read()

# Replace the whole block starting from `<!-- STEP 1: SHARE & PRINT PORTAL -->` up to `<!-- STEP 2: FIXTURES & LIVE SCORE CONTROL -->`

regex = r'\{\/\* ==========================================\n\s+STEP 1: SHARE & PRINT PORTAL\n\s+========================================== \*\/\}.*?(?=\{\/\* ==========================================\n\s+STEP 2: FIXTURES & LIVE SCORE CONTROL\n\s+========================================== \*\/\})'

good_block = """{/* ==========================================
          STEP 1: SHARE & PRINT PORTAL
          ========================================== */}
        <div className="mb-8">
          <ShareTournamentCard tournamentId={tournamentId} />
        </div>

        """

content = re.sub(regex, good_block, content, flags=re.DOTALL)

with open("pages/admin/TournamentManager.tsx", "w") as f:
    f.write(content)
