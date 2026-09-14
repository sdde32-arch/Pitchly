with open("pages/admin/TournamentManager.tsx", "r") as f:
    text = f.read()

text = text.replace("    </div>\n  );\n};", "      </div>\n    </div>\n  );\n};")

with open("pages/admin/TournamentManager.tsx", "w") as f:
    f.write(text)
