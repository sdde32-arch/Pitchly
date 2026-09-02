import re

with open('pages/BookingConfirmation.tsx', 'r') as f:
    content = f.read()

# Fix turf type setting
# const foundTurf = await pitchService.getById((foundBooking as any).pitchId || foundBooking.turfId);
# setTurf(foundTurf as any);
content = content.replace('setTurf(foundTurf);', 'setTurf(foundTurf as any);')

# Fix totalPrice
# (booking as any).totalPrice || booking.price || 0
# It's already fixed in the previous script! Wait, the linter ran BEFORE my previous script!
# Let's run lint again to see if it's already fixed.

with open('pages/BookingConfirmation.tsx', 'w') as f:
    f.write(content)
