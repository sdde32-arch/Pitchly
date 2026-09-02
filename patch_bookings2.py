with open('pages/Bookings.tsx', 'r') as f:
    content = f.read()

content = content.replace("UGX {(b.totalPrice || b.price || 0).toLocaleString()}", "UGX {((b as any).totalPrice || (b as any).price || 0).toLocaleString()}")
content = content.replace("{b.pitchName || b.turfName || \"Football Pitch\"}", "{(b as any).pitchName || (b as any).turfName || \"Football Pitch\"}")

with open('pages/Bookings.tsx', 'w') as f:
    f.write(content)
