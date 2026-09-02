import re

with open('pages/BookPitch.tsx', 'r') as f:
    content = f.read()

# Replace setBookingStep(4); with navigate(`/booking-confirmation/${bookingId}`);
content = content.replace('setBookingStep(4);', 'navigate(`/booking-confirmation/${bookingId}`);')

# Remove the entire Step 4 block. 
# We need to find {bookingStep === 4 && ( ... )}
pattern = re.compile(r'\{\s*bookingStep === 4 && \(\s*<div className="flex flex-col items-center justify-center text-center py-12">.*?</div>\s*\)\s*\}\s*</div>\s*</Layout>', re.DOTALL)

# Because there are closing divs, it's safer to just split string or use regex
new_content = pattern.sub('</div>\n    </Layout>', content)

with open('pages/BookPitch.tsx', 'w') as f:
    f.write(new_content)
