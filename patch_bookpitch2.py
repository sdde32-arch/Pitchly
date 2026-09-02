with open('pages/BookPitch.tsx', 'r') as f:
    content = f.read()

content = content.replace('pitchId: turf.id,', 'turfId: turf.id, turfName: turf.name, userName: user.displayName || "Unknown",')
content = content.replace('totalPrice: totalPrice,', 'price: totalPrice,')
content = content.replace('totalPrice = turf.pricePerHour * sortedTimes.length;', 'totalPrice = turf.pricePerHour * sortedTimes.length + 5000;')

with open('pages/BookPitch.tsx', 'w') as f:
    f.write(content)
