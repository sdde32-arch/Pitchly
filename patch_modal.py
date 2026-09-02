import re

with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

# 1. Update the modal container
content = content.replace(
    'className="bg-[#0D0D0D] w-full sm:w-[500px] h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-[32px] sm:rounded-3xl flex flex-col shadow-2xl border border-[#262626] overflow-hidden relative"',
    'className="bg-[#0D0D0D] w-full sm:w-[440px] h-[92vh] sm:h-auto sm:max-h-[92vh] rounded-t-[32px] sm:rounded-[32px] flex flex-col shadow-2xl border border-[#262626] overflow-hidden relative mx-auto"'
)

# 2. Update pb-24 to pb-32 in main scrolling areas
content = content.replace(
    'className="space-y-3 pb-24"',
    'className="space-y-3 pb-32"'
)
content = content.replace(
    'className="space-y-4 pb-24"',
    'className="space-y-4 pb-32"'
)
content = content.replace(
    'className="flex flex-col items-center justify-center text-center py-6 pb-24"',
    'className="flex flex-col items-center justify-center text-center py-6 pb-32"'
)

# 3. Update Absolute Bottom Action Bar padding
content = content.replace(
    'className="absolute bottom-0 left-0 right-0 bg-[#0D0D0D] p-4 sm:p-6 pb-safe border-t border-[#262626]"',
    'className="absolute bottom-0 left-0 right-0 bg-[#0D0D0D] p-4 sm:p-6 pb-6 sm:pb-6 border-t border-[#262626]"'
)

# 4. Update the Main Page Persistent Button
content = content.replace(
    'className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-auto sm:w-[852px] sm:ml-6 z-40"',
    'className="fixed bottom-4 sm:bottom-6 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-[440px] z-40"'
)

with open('pages/TurfDetail.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
