with open('pages/BookingConfirmation.tsx', 'r') as f:
    content = f.read()

content = content.replace('const foundTurf = await pitchService.getById(foundBooking.pitchId);', 'const foundTurf = await pitchService.getById((foundBooking as any).pitchId || foundBooking.turfId);')
content = content.replace('booking.slots[0]', '(booking.slots && booking.slots.length > 0 ? booking.slots[0] : booking.time)')
content = content.replace('parseInt(booking.slots[booking.slots.length - 1].split(\':\')[0])', 'parseInt(((booking.slots && booking.slots.length > 0 ? booking.slots[booking.slots.length - 1] : booking.time) || "0").split(":")[0])')
content = content.replace('booking.totalPrice', '((booking as any).totalPrice || booking.price || 0)')

with open('pages/BookingConfirmation.tsx', 'w') as f:
    f.write(content)
