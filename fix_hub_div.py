import re

with open("pages/tournament/TournamentHub.tsx", "r") as f:
    content = f.read()

# I want to remove the extra </div>
bad_str = """        <div className="mt-6">
          <ShareTournamentCard tournamentId={tournamentId || ''} />
        </div>
      </div>

      {/* 3. THREE PRIMARY TABS */}"""

good_str = """        <div className="mt-6">
          <ShareTournamentCard tournamentId={tournamentId || ''} />
        </div>

      {/* 3. THREE PRIMARY TABS */}"""

content = content.replace(bad_str, good_str)

with open("pages/tournament/TournamentHub.tsx", "w") as f:
    f.write(content)
