sed -i 's/const renderSectionHeader = ({ title }: { title: string }) => (/const SectionHeader = ({ title }: { title: string }) => (/g' pages/Settings.tsx
sed -i 's/renderSectionHeader( { title: "\(.*\)" })/<SectionHeader title="\1" \/>/g' pages/Settings.tsx

# Find lines to extract
awk '
/^export const Settings: React.FC = \(\) => {/ { inside = 1 }
/^  const SectionHeader = / { ext1 = 1 }
/^  const SettingItem = / { ext2 = 1 }

{
  if (ext1) {
    print $0 > "extracted.txt"
    if (/^\s*\}\);/ || /^\s*\);/) { ext1 = 0 }
    next
  }
  if (ext2) {
    print $0 >> "extracted.txt"
    if (/^\s*\}\);/ || /^\s*\);/ || /^\s*<\/div>\);/) { ext2 = 0 }
    next
  }
  print $0 > "pages/Settings_new.tsx"
}
' pages/Settings.tsx

# Prepend extracted to Settings
awk '
/^export const Settings: React.FC = \(\) => {/ {
  system("cat extracted.txt")
}
{ print }
' pages/Settings_new.tsx > pages/Settings.tsx

rm extracted.txt pages/Settings_new.tsx
