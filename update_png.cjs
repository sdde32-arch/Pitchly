const sharp = require('sharp');
const fs = require('fs');

async function generate() {
  const svg = fs.readFileSync('public/logo.svg');
  
  await sharp(svg)
    .resize(192, 192)
    .png()
    .toFile('public/icon-192.png');
    
  await sharp(svg)
    .resize(512, 512)
    .png()
    .toFile('public/icon-512.png');
    
  console.log('PNGs updated!');
}

generate().catch(console.error);
