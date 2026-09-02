with open('components/PitchCard.tsx', 'r') as f:
    content = f.read()

content = content.replace("const ratingVal = (pitch as any).rating ? Number((pitch as any).rating).toFixed(1) : '4.8';", "const ratingVal = (pitch as any).rating !== undefined && (pitch as any).rating !== null ? Number((pitch as any).rating).toFixed(1) : '4.8';")

with open('components/PitchCard.tsx', 'w') as f:
    f.write(content)
