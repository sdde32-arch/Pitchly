with open('pages/BookingConfirmation.tsx', 'r') as f:
    content = f.read()

content = content.replace('let foundBooking = bookings.find(b => b.id === id) || null;', 'let foundBooking: any = bookings.find(b => b.id === id) || null;')

with open('pages/BookingConfirmation.tsx', 'w') as f:
    f.write(content)
