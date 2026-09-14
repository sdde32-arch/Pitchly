with open("pages/tournament/TournamentHub.tsx", "r") as f:
    text = f.read()

def find_div_mismatches(text):
    depth = 0
    in_jsx = False
    lines = text.split("\n")
    for i, line in enumerate(lines):
        starts = line.count("<div")
        ends = line.count("</div")
        if starts > 0 or ends > 0:
            depth += (starts - ends)
            # print(f"L{i+1}: starts={starts}, ends={ends}, depth={depth}")
            if depth < 0:
                print(f"ERROR: depth went negative at line {i+1}! Line content: {line.strip()}")
                return
    print(f"Final depth: {depth}")

find_div_mismatches(text)
