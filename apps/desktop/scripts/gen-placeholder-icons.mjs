#!/usr/bin/env node
/**
 * Generates placeholder icons for the Tauri bundle.
 *
 * Produces solid-color PNGs at the sizes Tauri expects, plus a minimal
 * multi-size ICO. Replace these with real branded assets before shipping.
 *
 * Run from apps/desktop:
 *   npm run gen:icons
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = resolve(__dirname, '..', 'src-tauri', 'icons');
mkdirSync(iconsDir, { recursive: true });

// FlipCard brand placeholder: deep teal background.
const BG = { r: 0x0f, g: 0x76, b: 0x6e, a: 0xff };
const FG = { r: 0xff, g: 0xff, b: 0xff, a: 0xff };

function makePng(size) {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      // Simple "FC" stamp: draw a centered white square as a placeholder mark.
      const inset = Math.floor(size * 0.25);
      const inMark =
        x >= inset && x < size - inset && y >= inset && y < size - inset;
      const color = inMark ? FG : BG;
      png.data[idx] = color.r;
      png.data[idx + 1] = color.g;
      png.data[idx + 2] = color.b;
      png.data[idx + 3] = color.a;
    }
  }
  return PNG.sync.write(png);
}

function writePng(name, size) {
  const buf = makePng(size);
  const out = join(iconsDir, name);
  writeFileSync(out, buf);
  console.log(`wrote ${out} (${size}x${size}, ${buf.length} bytes)`);
  return buf;
}

// Standard Tauri icon set.
const png32 = writePng('32x32.png', 32);
writePng('128x128.png', 128);
writePng('128x128@2x.png', 256);
writePng('icon.png', 1024);

// Minimal ICO containing the 32x32 PNG (PNG-in-ICO is supported by Vista+).
function buildIco(pngBuffers) {
  // ICONDIR (6 bytes) + ICONDIRENTRY (16 bytes) per image + image data.
  const count = pngBuffers.length;
  const headerSize = 6 + 16 * count;
  let totalSize = headerSize;
  for (const b of pngBuffers) totalSize += b.png.length;

  const buf = Buffer.alloc(totalSize);
  let offset = 0;
  buf.writeUInt16LE(0, offset); offset += 2; // reserved
  buf.writeUInt16LE(1, offset); offset += 2; // type = icon
  buf.writeUInt16LE(count, offset); offset += 2; // image count

  let dataOffset = headerSize;
  for (const { size, png } of pngBuffers) {
    buf.writeUInt8(size === 256 ? 0 : size, offset); offset += 1; // width
    buf.writeUInt8(size === 256 ? 0 : size, offset); offset += 1; // height
    buf.writeUInt8(0, offset); offset += 1; // palette
    buf.writeUInt8(0, offset); offset += 1; // reserved
    buf.writeUInt16LE(1, offset); offset += 2; // color planes
    buf.writeUInt16LE(32, offset); offset += 2; // bits per pixel
    buf.writeUInt32LE(png.length, offset); offset += 4; // image data size
    buf.writeUInt32LE(dataOffset, offset); offset += 4; // image data offset
    dataOffset += png.length;
  }
  let writePos = headerSize;
  for (const { png } of pngBuffers) {
    png.copy(buf, writePos);
    writePos += png.length;
  }
  return buf;
}

const png256 = makePng(256);
const ico = buildIco([
  { size: 32, png: png32 },
  { size: 256, png: png256 },
]);
const icoPath = join(iconsDir, 'icon.ico');
writeFileSync(icoPath, ico);
console.log(`wrote ${icoPath} (${ico.length} bytes)`);

// Placeholder .icns — Tauri only consumes this on macOS builds; a stub keeps
// the bundle config happy on Windows where it is ignored.
const icnsStub = Buffer.concat([
  Buffer.from('icns', 'ascii'),
  Buffer.alloc(4), // total length placeholder
]);
icnsStub.writeUInt32BE(icnsStub.length, 4);
writeFileSync(join(iconsDir, 'icon.icns'), icnsStub);
console.log(`wrote ${join(iconsDir, 'icon.icns')} (${icnsStub.length} bytes — stub, regenerate for macOS)`);
