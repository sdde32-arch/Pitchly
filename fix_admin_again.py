import re

with open("pages/admin/TournamentManager.tsx", "r") as f:
    content = f.read()

start_marker = "{/* ==========================================\n          STEP 1: SHARE & PRINT PORTAL"
end_marker = "{/* ==========================================\n          STEP 2: FIXTURES"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    good_block = """{/* ==========================================
          STEP 1: SHARE & PRINT PORTAL
          ========================================== */}
        <div className="mb-8">
          <ShareTournamentCard tournamentId={tournamentId || ''} />
        </div>

        """
    content = content[:start_idx] + good_block + content[end_idx:]
    with open("pages/admin/TournamentManager.tsx", "w") as f:
        f.write(content)
    print("Replaced!")
else:
    print("Markers not found!")
