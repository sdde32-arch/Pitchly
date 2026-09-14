import re

with open("pages/admin/TournamentManager.tsx", "r") as f:
    content = f.read()

bad_block = """        <div className="bg-surface-card rounded-2xl border border-border-subtle p-5 sm:p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="flex-1 space-y-2">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Share2 size={16} className="text-primary-lime" />
                Share Tournament Hub
              </h3>
              <p className="text-xs text-text-secondary max-w-xl">
                Invite players, fans, and scouts to follow the action live. Share this link for real-time scores, leaderboards, and MOTM voting.
              </p>
            </div>
            
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <div className="flex items-center gap-2 bg-app-base border border-border-subtle rounded-xl p-1.5 pl-3">
              <span className="text-xs font-mono text-text-secondary truncate flex-1 select-all min-w-[200px]">
                {publicUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-primary flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-primary-lime" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} className="text-text-secondary" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
            
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handlePrintFlyer}
                className="px-3 py-1.5 rounded-lg bg-surface-card hover:bg-surface-raised border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer size={13} />
                <span>Print Pitchside Flyer</span>
              </button>
            </div>
          </div>
            
          <div className="hidden md:block border-l border-border-subtle pl-6 ml-2">
            <div className="bg-white p-2 rounded-xl">
              <QRCodeSVG value={publicUrl} size={80} level="M" />
            </div>
          </div>
        </div>
        </div>"""

good_block = """        <div className="mb-8">
          <ShareTournamentCard tournamentId={tournamentId} />
        </div>"""

content = content.replace(bad_block, good_block)

with open("pages/admin/TournamentManager.tsx", "w") as f:
    f.write(content)
