with open("pages/admin/TournamentManager.tsx", "r") as f:
    text = f.read()

bad = """      {actionError && (
        <div className="bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">

      {/* 3. THREE MANAGEMENT COLUMNS / FORMS */}"""

good = """      {actionError && (
        <div className="bg-[#EF4444]/15 border border-[#EF4444]/40 text-[#EF4444] px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <span>{actionError}</span>
        </div>
      )}

      {/* 1. SHARE PORTAL */}
      <div className="mb-8">
        <ShareTournamentCard tournamentId={tournamentId || ''} />
      </div>

      {/* 3. THREE MANAGEMENT COLUMNS / FORMS */}"""

text = text.replace(bad, good)
with open("pages/admin/TournamentManager.tsx", "w") as f:
    f.write(text)
