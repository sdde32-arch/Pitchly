with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

start_marker = "<AnimatePresence>"
end_marker_actual = "      <ReportModal"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker_actual)

print(start_idx)
print(end_idx)
