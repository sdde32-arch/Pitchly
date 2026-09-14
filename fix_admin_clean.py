import os

with open("pages/admin/TournamentManager.tsx", "r") as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "{/* ==========================================" in line and "STEP 1: SHARE & PRINT PORTAL" in lines[i+1]:
        skip = True
        new_lines.append("{/* ==========================================\n")
        new_lines.append("          STEP 1: SHARE & PRINT PORTAL\n")
        new_lines.append("          ========================================== */}\n")
        new_lines.append("        <div className=\"mb-8\">\n")
        new_lines.append("          <ShareTournamentCard tournamentId={tournamentId || ''} />\n")
        new_lines.append("        </div>\n\n")
        continue
    
    if skip and "{/* ==========================================" in line and "STEP 2: FIXTURES" in lines[i+1]:
        skip = False
    
    if not skip:
        new_lines.append(line)

with open("pages/admin/TournamentManager.tsx", "w") as f:
    f.writelines(new_lines)
