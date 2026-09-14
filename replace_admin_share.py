import re

with open("pages/admin/TournamentManager.tsx", "r") as f:
    content = f.read()

# Add import
import_statement = 'import { ShareTournamentCard } from "../../components/tournament/ShareTournamentCard";\n'
content = content.replace('import { QRCodeSVG } from "qrcode.react";', import_statement)

# Replace section
start_marker = "      {/* 2. SHAREABLE LINK & QR CODE SECTION */}"
end_marker = "      {/* 3. TABS NAVIGATION */}"
start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    replacement = "      {/* 2. SHAREABLE LINK & QR CODE SECTION */}\n      <ShareTournamentCard tournamentId={tournamentId} />\n\n"
    content = content[:start_idx] + replacement + content[end_idx:]

with open("pages/admin/TournamentManager.tsx", "w") as f:
    f.write(content)
