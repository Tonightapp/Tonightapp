// Tonight App — Icon Generator (Node.js, no dependencies)
// Generates all required PWA/store icons as PNG files using raw PNG encoding

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ── Pure-JS PNG writer ──────────────────────────────────────────────────────

function crc32(buf) {
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })());
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.concat([typeBytes, data]);
  const crcVal = Buffer.alloc(4); crcVal.writeUInt32BE(crc32(crcBuf));
  return Buffer.concat([len, typeBytes, data, crcVal]);
}

function makePNG(size, bgHex, fgHex, label) {
  // Parse colors
  const bg = [parseInt(bgHex.slice(1,3),16), parseInt(bgHex.slice(3,5),16), parseInt(bgHex.slice(5,7),16)];
  const fg = [parseInt(fgHex.slice(1,3),16), parseInt(fgHex.slice(3,5),16), parseInt(fgHex.slice(5,7),16)];

  // Render pixel grid (RGBA)
  const pixels = new Uint8Array(size * size * 4);

  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels[i*4]   = bg[0];
    pixels[i*4+1] = bg[1];
    pixels[i*4+2] = bg[2];
    pixels[i*4+3] = 255;
  }

  // Draw rounded rect mask (for maskable icons — safe zone 80%)
  const r = Math.round(size * 0.18); // corner radius
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Corner rounding
      const inCorner = (
        (x < r && y < r && Math.hypot(x-r, y-r) > r) ||
        (x > size-1-r && y < r && Math.hypot(x-(size-1-r), y-r) > r) ||
        (x < r && y > size-1-r && Math.hypot(x-r, y-(size-1-r)) > r) ||
        (x > size-1-r && y > size-1-r && Math.hypot(x-(size-1-r), y-(size-1-r)) > r)
      );
      if (inCorner) {
        pixels[(y*size+x)*4+3] = 0; // transparent
      }
    }
  }

  // Draw a simple "T" glyph centered (for "TONIGHT" branding)
  // Scale glyph with icon size
  const glyphScale = size / 512;
  const drawRect = (x1, y1, w, h, color) => {
    const sx = Math.round(x1 * glyphScale);
    const sy = Math.round(y1 * glyphScale);
    const sw = Math.round(w * glyphScale);
    const sh = Math.round(h * glyphScale);
    for (let gy = sy; gy < sy+sh && gy < size; gy++) {
      for (let gx = sx; gx < sx+sw && gx < size; gx++) {
        if (gx >= 0 && gy >= 0) {
          pixels[(gy*size+gx)*4]   = color[0];
          pixels[(gy*size+gx)*4+1] = color[1];
          pixels[(gy*size+gx)*4+2] = color[2];
          pixels[(gy*size+gx)*4+3] = 255;
        }
      }
    }
  };

  // Draw subtle radial glow behind T
  const cx = size/2, cy = size/2, maxR = size*0.38;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (pixels[(y*size+x)*4+3] === 0) continue;
      const d = Math.hypot(x-cx, y-cy) / maxR;
      if (d < 1) {
        const glow = Math.round((1-d*d) * 22);
        pixels[(y*size+x)*4]   = Math.min(255, pixels[(y*size+x)*4]   + glow);
        pixels[(y*size+x)*4+1] = Math.min(255, pixels[(y*size+x)*4+1] + Math.round(glow*0.6));
      }
    }
  }

  // Bold "T" letter — top bar + vertical stem
  const tColor = fg;
  const barH = 52, barY = 148, stemW = 68, stemH = 220;
  const barX = 156, barW = 200;
  const stemX = 156 + (200 - 68) / 2;
  const stemY = barY + barH;
  drawRect(barX, barY, barW, barH, tColor);         // horizontal bar
  drawRect(stemX, stemY, stemW, stemH, tColor);     // vertical stem

  // Encode as PNG
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // Build raw scanlines
  const raw = Buffer.alloc(size * (size*4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y*(size*4+1)] = 0; // filter type: None
    for (let x = 0; x < size; x++) {
      const pi = (y*size+x)*4;
      const ri = y*(size*4+1) + 1 + x*4;
      raw[ri]   = pixels[pi];
      raw[ri+1] = pixels[pi+1];
      raw[ri+2] = pixels[pi+2];
      raw[ri+3] = pixels[pi+3];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function makeSplashPNG(w, h, bgHex) {
  const bg = [parseInt(bgHex.slice(1,3),16), parseInt(bgHex.slice(3,5),16), parseInt(bgHex.slice(5,7),16)];
  const fg = [245, 200, 66];

  const pixels = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    pixels[i*4]=bg[0]; pixels[i*4+1]=bg[1]; pixels[i*4+2]=bg[2]; pixels[i*4+3]=255;
  }

  const glyphScale = Math.min(w,h) / 512;
  const offX = (w - 512*glyphScale) / 2;
  const offY = (h - 512*glyphScale) / 2;

  const drawRect = (x1, y1, rw, rh, color) => {
    const sx = Math.round(offX + x1*glyphScale), sy = Math.round(offY + y1*glyphScale);
    const sw = Math.round(rw*glyphScale), sh = Math.round(rh*glyphScale);
    for (let gy = sy; gy < sy+sh && gy < h; gy++) {
      for (let gx = sx; gx < sx+sw && gx < w; gx++) {
        if (gx>=0 && gy>=0) {
          pixels[(gy*w+gx)*4]=color[0]; pixels[(gy*w+gx)*4+1]=color[1];
          pixels[(gy*w+gx)*4+2]=color[2]; pixels[(gy*w+gx)*4+3]=255;
        }
      }
    }
  };

  drawRect(156, 148, 200, 52, fg);
  drawRect(156+(200-68)/2, 148+52, 68, 220, fg);

  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w,0); ihdr.writeUInt32BE(h,4);
  ihdr[8]=8; ihdr[9]=6;

  const raw = Buffer.alloc(h*(w*4+1));
  for (let y=0;y<h;y++) {
    raw[y*(w*4+1)]=0;
    for (let x=0;x<w;x++) {
      const pi=(y*w+x)*4, ri=y*(w*4+1)+1+x*4;
      raw[ri]=pixels[pi]; raw[ri+1]=pixels[pi+1]; raw[ri+2]=pixels[pi+2]; raw[ri+3]=pixels[pi+3];
    }
  }
  const compressed = zlib.deflateSync(raw, {level:6});
  return Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',compressed), chunk('IEND',Buffer.alloc(0))]);
}

// ── Generate all icons ──────────────────────────────────────────────────────

const iconDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconDir)) fs.mkdirSync(iconDir);

const BG = '#0a0b14';
const FG = '#f5c842';

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
for (const s of sizes) {
  const buf = makePNG(s, BG, FG, 'T');
  fs.writeFileSync(path.join(iconDir, `icon-${s}.png`), buf);
  console.log(`✓ icon-${s}.png`);
}

// Splash screens
const splashDir = path.join(__dirname, 'icons');
const splashBuf1 = makeSplashPNG(1170, 2532, BG);
fs.writeFileSync(path.join(splashDir, 'splash-390.png'), splashBuf1);
console.log('✓ splash-390.png (iPhone 14)');

const splashBuf2 = makeSplashPNG(1290, 2796, BG);
fs.writeFileSync(path.join(splashDir, 'splash-430.png'), splashBuf2);
console.log('✓ splash-430.png (iPhone 14 Pro Max)');

// Feature graphic for Google Play (1024x500)
const featureBuf = makeSplashPNG(1024, 500, BG);
fs.writeFileSync(path.join(splashDir, 'feature-graphic.png'), featureBuf);
console.log('✓ feature-graphic.png (Google Play 1024×500)');

console.log('\n✅ All icons generated in /icons/');
