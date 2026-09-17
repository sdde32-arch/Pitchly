import os
import re

files_to_fix = [
    'pages/ExploreMap.tsx',
    'pages/Profile.tsx',
    'pages/BookingConfirmation.tsx',
    'pages/TurfDetail.tsx',
    'pages/Bookings.tsx',
    'pages/MatchSummary.tsx',
    'pages/ChatRoom.tsx',
    'pages/Settings.tsx',
    'pages/BookPitch.tsx',
    'pages/Support.tsx'
]

for file_path in files_to_fix:
    if not os.path.exists(file_path):
        continue
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Replace the usage of ChevronLeft with ArrowLeft in the back button
    # but we need to ensure ArrowLeft is imported.
    if 'ChevronLeft' in content and 'Go back' in content or 'Return to Home' in content or 'navigate(-1)' in content or 'history' in content or 'Back to' in content:
        # Import replacement
        if 'ArrowLeft' not in content:
            content = content.replace('ChevronLeft', 'ArrowLeft, ChevronLeft', 1)
        
        # Usage replacement (heuristics for back buttons)
        # We will replace <ChevronLeft size={...} /> inside buttons that look like back buttons.
        # Simple way: just replace all <ChevronLeft that are size 18, 20, 22, 24 with ArrowLeft if it's the main back button.
        # Actually, let's just do a blanket replace for ChevronLeft to ArrowLeft for these specific files' back buttons.
        content = re.sub(r'<ChevronLeft\s+(size=\{[0-9]+\}\s*(?:strokeWidth=\{[0-9.]+\}\s*)?|className=.*?)\s*/>', r'<ArrowLeft \1/>', content)
        
        with open(file_path, 'w') as f:
            f.write(content)
        print(f"Fixed {file_path}")

