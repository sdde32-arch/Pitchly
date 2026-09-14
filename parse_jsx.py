import re

with open("pages/tournament/TournamentHub.tsx", "r") as f:
    text = f.read()

# find return ( ... ); for TournamentHub
start = text.find("return (")
end = text.find("};", start)
component_body = text[start:end]

# Extract all <tag> and </tag>
tags = re.findall(r'</?([a-zA-Z0-9]+)(?:[^>]*?)>', component_body)

stack = []
for tag in tags:
    if tag.startswith('/'):
        # pop
        if not stack:
            print(f"Error: tried to close {tag} but stack is empty")
        else:
            last = stack.pop()
            if last != tag[1:]:
                print(f"Error: tried to close {tag} but last opened was {last}")
    else:
        # Check if it's self-closing by looking at original string
        # Actually it's simpler:
        pass
