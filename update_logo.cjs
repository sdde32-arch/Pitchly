const fs = require('fs');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <!-- Base Light Squircle Tile (#FFFFFF) -->
  <rect x="16" y="16" width="480" height="480" rx="110" ry="110" fill="#FFFFFF" />

  <!-- Logo Content Group -->
  <g transform="translate(10, 20)">
    <!-- Bold Black Letter P in Sora Font Style -->
    <text
      x="140"
      y="380"
      fill="#0D0D0D"
      font-family="Sora, system-ui, -apple-system, sans-serif"
      font-size="340"
      font-weight="800"
      letter-spacing="-0.04em"
    >p</text>
    
    <!-- Bouncing Arc Line -->
    <path 
      d="M 120 180 Q 220 10 320 95" 
      fill="none" 
      stroke="#58CC02" 
      stroke-width="18" 
      stroke-linecap="round"
    />

    <!-- Vibrant Neon Green Circle, no glow filter -->
    <g transform="translate(320, 95)">
      <!-- Lime Ball Base -->
      <circle cx="0" cy="0" r="48" fill="#58CC02" />
    </g>
  </g>
</svg>`;

fs.writeFileSync('public/logo.svg', svgContent);
console.log('Logo SVG updated.');
