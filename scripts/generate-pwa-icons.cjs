const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const body = Buffer.concat([typeBuf, data]);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(body), 0);

  return Buffer.concat([lenBuf, body, crcBuf]);
}

function createPng(width, height, isMaskable = false) {
  // RGBA buffer
  const scanlineLength = width * 4 + 1; // 1 filter byte per line
  const rawData = Buffer.alloc(scanlineLength * height);

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * (isMaskable ? 0.40 : 0.46);

  for (let y = 0; y < height; y++) {
    const lineOffset = y * scanlineLength;
    rawData[lineOffset] = 0; // Filter type 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = lineOffset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Deep dark blue / slate background #090d16
      let r = 9;
      let g = 13;
      let b = 22;
      let a = 255;

      // Outer gradient circle
      if (dist <= radius) {
        // Gradient from indigo #6366f1 to purple #a855f7 to emerald #10b981
        const t = (x + y) / (width + height);
        r = Math.round(99 * (1 - t) + 16 * t);
        g = Math.round(102 * (1 - t) + 185 * t);
        b = Math.round(241 * (1 - t) + 129 * t);

        // Inner shield / badge shape
        const innerRadius = radius * 0.75;
        if (dist <= innerRadius) {
          // Inside shield: deep navy #020617
          r = 2;
          g = 6;
          b = 23;

          // Central credit card / lightning symbol
          const inCard =
            Math.abs(dx) <= innerRadius * 0.55 &&
            Math.abs(dy) <= innerRadius * 0.35;
          if (inCard) {
            // Card outline or chip
            const isChip = Math.abs(dx + innerRadius * 0.25) <= innerRadius * 0.12 && Math.abs(dy) <= innerRadius * 0.12;
            if (isChip) {
              r = 245; g = 158; b = 11; // Gold chip #f59e0b
            } else if (dy > -innerRadius * 0.05 && dy < innerRadius * 0.08) {
              r = 99; g = 102; b = 241; // Stripe purple stripe
            } else {
              r = 255; g = 255; b = 255; // White card accents
            }
          }
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // PNG Header
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: 6 (RGBA)
  ihdr[10] = 0; // Compression: deflate
  ihdr[11] = 0; // Filter: basic
  ihdr[12] = 0; // Interlace: none
  const ihdrChunk = writeChunk('IHDR', ihdr);

  // IDAT
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = writeChunk('IDAT', compressed);

  // IEND
  const iendChunk = writeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate PWA icons
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), createPng(192, 192, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), createPng(512, 512, false));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), createPng(512, 512, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), createPng(180, 180, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createPng(64, 64, false));

// Also generate high-quality SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5" />
      <stop offset="50%" stop-color="#7c3aed" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="#020617" />
  <circle cx="256" cy="256" r="210" fill="url(#bgGrad)" opacity="0.9" />
  <circle cx="256" cy="256" r="180" fill="#020617" />
  <rect x="136" y="176" width="240" height="160" rx="24" fill="url(#cardGrad)" stroke="#6366f1" stroke-width="6" />
  <rect x="136" y="216" width="240" height="32" fill="#6366f1" opacity="0.6" />
  <rect x="168" y="272" width="48" height="36" rx="8" fill="#f59e0b" />
  <circle cx="330" cy="288" r="16" fill="#10b981" opacity="0.9" />
  <circle cx="310" cy="288" r="16" fill="#6366f1" opacity="0.8" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent, 'utf8');

console.log('✅ All PWA icons generated successfully in public/');
