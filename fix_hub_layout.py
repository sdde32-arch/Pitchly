import re

with open("pages/tournament/TournamentHub.tsx", "r") as f:
    content = f.read()

bad_str = """        </div>
      </div>

        <div className="mt-6">
          <ShareTournamentCard tournamentId={tournamentId || ''} />
        </div>

      {/* 3. THREE PRIMARY TABS */}"""

good_str = """        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-6">
        <ShareTournamentCard tournamentId={tournamentId || ''} />
      </div>

      {/* 3. THREE PRIMARY TABS */}"""

content = content.replace(bad_str, good_str)

with open("pages/tournament/TournamentHub.tsx", "w") as f:
    f.write(content)
