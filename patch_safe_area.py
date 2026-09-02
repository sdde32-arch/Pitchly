import re

with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

# Replace the absolute bottom bar padding with safe-area support
content = content.replace(
    'className="absolute bottom-0 left-0 right-0 bg-[#0D0D0D] p-4 sm:p-6 pb-6 sm:pb-6 border-t border-[#262626]"',
    'className="absolute bottom-0 left-0 right-0 bg-[#0D0D0D] p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-6 border-t border-[#262626]"'
)

with open('pages/TurfDetail.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
