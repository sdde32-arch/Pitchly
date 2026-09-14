import re

with open("pages/tournament/TournamentHub.tsx", "r") as f:
    content = f.read()

# Add import
import_statement = 'import { ShareTournamentCard } from "../../components/tournament/ShareTournamentCard";\n'
content = content.replace('import { Logo } from "../../components/Logo";', 'import { Logo } from "../../components/Logo";\n' + import_statement)

# Replace section
target = "      {/* 3. THREE PRIMARY TABS */}"
replacement = """        <div className="mt-6">
          <ShareTournamentCard tournamentId={tournamentId || ''} />
        </div>
      </div>

      {/* 3. THREE PRIMARY TABS */}"""

content = content.replace(target, replacement)

with open("pages/tournament/TournamentHub.tsx", "w") as f:
    f.write(content)
