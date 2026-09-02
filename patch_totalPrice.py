with open('pages/BookPitch.tsx', 'r') as f:
    content = f.read()

content = content.replace('totalPrice = turf.pricePerHour * sortedTimes.length + 5000;', 'totalPrice = turf.pricePerHour * sortedTimes.length;')

with open('pages/BookPitch.tsx', 'w') as f:
    f.write(content)
