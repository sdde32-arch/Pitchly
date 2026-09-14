import re

with open("pages/admin/TournamentManager.tsx", "r") as f:
    content = f.read()

# Remove handleCopyLink
handle_copy_regex = r'  const handleCopyLink = async \(\) => \{\n.*?  \};\n\n'
content = re.sub(handle_copy_regex, '', content, flags=re.DOTALL)

# Remove handlePrintFlyer
handle_print_regex = r'  const handlePrintFlyer = \(\) => \{\n.*?  \};\n\n'
content = re.sub(handle_print_regex, '', content, flags=re.DOTALL)

# Remove unused states
content = re.sub(r'  const \[copied, setCopied\] = useState\(false\);\n', '', content)

# QRCodeSVG is already removed

with open("pages/admin/TournamentManager.tsx", "w") as f:
    f.write(content)
