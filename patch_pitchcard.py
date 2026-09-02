with open('components/PitchCard.tsx', 'r') as f:
    content = f.read()

content = content.replace("const ratingVal = (pitch as any).rating || '4.8';", "const ratingVal = (pitch as any).rating ? Number((pitch as any).rating).toFixed(1) : '4.8';")

with open('components/PitchCard.tsx', 'w') as f:
    f.write(content)
