import re

with open("pages/admin/TournamentManager.tsx", "r") as f:
    text = f.read()

start = text.find("return (")
end = text.rfind("};")
component_body = text[start:end]

tags = re.findall(r'</?([a-zA-Z0-9]+)(?:[^>]*?)>', component_body)
stack = []
for tag in tags:
    if tag.startswith('/'):
        if not stack:
            print(f"Error: tried to close {tag} but stack is empty")
        else:
            last = stack.pop()
            if last != tag[1:]:
                print(f"Error: tried to close {tag} but last opened was {last}")
    else:
        # crude handling of self-closing by looking at original
        pass
print(f"Remaining stack: {stack}")
