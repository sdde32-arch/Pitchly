const fs = require('fs');
let content = fs.readFileSync('pages/TurfDetail.tsx', 'utf8');
content = content.replace(
  /<img src={turf\.image} className="w-full h-full object-cover relative z-\[5\]" alt={turf\.name} onError={\(e\) => { e\.currentTarget\.style\.display = 'none'; }} \/>/g,
  `{turf.image ? (
            <div className="absolute inset-0 z-[5] bg-[var(--color-surface-elevated)]">
              <img
                src={turf.image}
                className="w-full h-full object-cover"
                alt={turf.name}
                onError={(e) => {
                  e.currentTarget.parentElement!.style.display = 'none';
                }}
              />
            </div>
          ) : null}`
);
fs.writeFileSync('pages/TurfDetail.tsx', content);
