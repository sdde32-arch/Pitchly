with open('pages/BookPitch.tsx', 'r') as f:
    content = f.read()

content = content.replace('turfId: turf.id, turfName: turf.name, userName: user.displayName || "Unknown",', 'pitchId: turf.id,')
content = content.replace('price: totalPrice,', 'totalPrice: totalPrice,')

with open('pages/BookPitch.tsx', 'w') as f:
    f.write(content)
