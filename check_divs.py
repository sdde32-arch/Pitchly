with open("pages/tournament/TournamentHub.tsx", "r") as f:
    text = f.read()

div_starts = text.count("<div")
div_ends = text.count("</div")

print(f"Starts: {div_starts}, Ends: {div_ends}")
