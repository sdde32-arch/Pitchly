import re

with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

# Fix the lowercase buttons
content = content.replace(
    '<span className="lowercase font-bold tracking-wide">continue to payment</span>',
    '<span className="font-bold tracking-wide">Continue to Payment</span>'
)
content = content.replace(
    '<span className="lowercase font-bold tracking-wide">processing...</span>',
    '<span className="font-bold tracking-wide">Processing...</span>'
)
content = content.replace(
    '<span className="lowercase font-bold tracking-wide">confirm booking</span>',
    '<span className="font-bold tracking-wide">Confirm Booking</span>'
)
content = content.replace(
    '<span className="lowercase font-bold tracking-wide">view my bookings</span>',
    '<span className="font-bold tracking-wide">View My Bookings</span>'
)

with open('pages/TurfDetail.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
