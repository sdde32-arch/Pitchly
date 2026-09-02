with open('pages/Home.tsx', 'r') as f:
    content = f.read()

content = content.replace("rating: 4.8 + ((idx % 3) * 0.1),", "rating: (p as any).rating !== undefined && (p as any).rating !== null ? (p as any).rating : (4.8 + ((idx % 3) * 0.1)),")

with open('pages/Home.tsx', 'w') as f:
    f.write(content)
