import re

with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

start_marker = "<AnimatePresence>"
end_marker = "      <ReportModal"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Could not find markers")
    exit(1)

with open('new_modal.jsx', 'r') as f:
    new_modal_jsx = f.read()

content = content[:start_idx] + new_modal_jsx + "\n" + content[end_idx:]

with open('pages/TurfDetail.tsx', 'w') as f:
    f.write(content)
print("SUCCESS")
