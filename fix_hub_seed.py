import re

with open("pages/tournament/TournamentHub.tsx", "r") as f:
    text = f.read()

# I will insert a useEffect that auto-seeds
seed_effect = """  useEffect(() => {
    // AUTO SEED for demo purposes if it's the wehat tournament and it's empty
    if (!loading && fixtures.length === 0 && tournamentId === 'wehat-s2-w1') {
      console.log("Auto-seeding WEHAT tournament for demo...");
      tournamentService.seedWehatTournament(tournamentId).catch(console.error);
    }
  }, [loading, fixtures.length, tournamentId]);

  const [activeTab, setActiveTab] = useState<"scores" | "scorers" | "motm">("scores");"""

text = text.replace('  const [activeTab, setActiveTab] = useState<"scores" | "scorers" | "motm">("scores");', seed_effect)

with open("pages/tournament/TournamentHub.tsx", "w") as f:
    f.write(text)
