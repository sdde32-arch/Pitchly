with open('pages/TurfDetail.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
pitch_service_imported = False
for line in lines:
    if 'import { pitchService } from "../services/pitchService";' in line:
        if not pitch_service_imported:
            pitch_service_imported = True
            new_lines.append(line)
    else:
        new_lines.append(line)

content = "".join(new_lines)
content = content.replace('await pitchService.update(turf.id, { rating: avg });', 'await pitchService.update(turf.id, { rating: avg } as any);')

with open('pages/TurfDetail.tsx', 'w') as f:
    f.write(content)
