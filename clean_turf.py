import re

with open('pages/TurfDetail.tsx', 'r') as f:
    content = f.read()

# Remove specific imports
content = re.sub(r'import { bookingService } from "../services/bookingService";\n', '', content)
content = re.sub(r'import { storageService } from "../services/storageService";\n', '', content)
content = re.sub(r'import { PaymentMethod } from "../types";\n', '', content)
content = re.sub(r'import { handleFirestoreError, OperationType } from "../lib/firebase";\n', '', content)

# Instead of complex regex for all state and functions, we can just replace a large block
# The block starts right after `const galleryImages = ...` up to `// Real-time listener for pitch slot availability`
# Actually, everything from `// Date and slot selection states` down to `useEffect(() => {\n    const fetchPitch = async () => {` can be removed!
pattern = r'// Date and slot selection states.*?useEffect\(\(\) => \{\n    const fetchPitch'
content = re.sub(pattern, 'useEffect(() => {\n    const fetchPitch', content, flags=re.DOTALL)

# Remove the INTERACTIVE CALENDAR section in JSX
# Starts with `{/* INTERACTIVE CALENDAR & AVAILABILITY SECTION */}` 
# Ends before `{/* TIMEFRAME SELECTION & PAYMENT MODAL */}`
pattern2 = r'\{/\* INTERACTIVE CALENDAR & AVAILABILITY SECTION \*/\}.*?\{/\* TIMEFRAME SELECTION & PAYMENT MODAL \*/\}'
content = re.sub(pattern2, '{/* TIMEFRAME SELECTION & PAYMENT MODAL */}', content, flags=re.DOTALL)

# Remove the Modal
pattern3 = r'\{/\* TIMEFRAME SELECTION & PAYMENT MODAL \*/\}.*?</AnimatePresence>'
content = re.sub(pattern3, '', content, flags=re.DOTALL)

# Update the Book Now button
old_btn = r'\{!isTimeframeModalOpen && \(\n          <button.*?onClick=\{.*?\}\n            className="w-full py-4 bg-\[#A8FF00\].*?>.*?\{.*?\}'
old_btn_full = r'\{!isTimeframeModalOpen && \(\n          <button.*?</button>\n        \)\}'

new_btn = """<button
            onClick={() => navigate(`/turf/${turf.id}/book`)}
            className="w-full py-4 bg-[#A8FF00] hover:bg-[#96E600] text-[#0D0D0D] font-extrabold text-[15px] uppercase tracking-wider rounded-xl shadow-[0_0_20px_rgba(168,255,0,0.2)] active:scale-[0.98] transition-all cursor-pointer text-center"
          >
            BOOK NOW
          </button>"""

content = re.sub(old_btn_full, new_btn, content, flags=re.DOTALL)

with open('pages/TurfDetail.tsx', 'w') as f:
    f.write(content)

