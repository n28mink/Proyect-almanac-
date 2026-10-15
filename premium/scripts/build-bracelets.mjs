#!/usr/bin/env node
/**
 * Fotos reales de las pulseras (4 por pieza), conservando el fondo crema original de las fotos.
 *   node scripts/build-bracelets.mjs
 *
 * Lee assets-src/bracelets/<id>-<rol>.<ext> con rol: a = en ángulo (principal), h = con mano modelo, f = de frente, c = close-up.
 * Escribe public/media/products/<id>-ang|hand|front|close.jpg (hasta 1600², calidad 90 con nitidez suave) y actualiza sus metadatos en
 * src/content/media.generated.json. Las fotos no cuadradas se ajustan sin deformar: se amplía el fondo (pad) o se recorta (crop)
 * según CONFIG. Después: npm run seed.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'assets-src/bracelets');
const OUT = path.join(root, 'public/media/products');
const MANIFEST = path.join(root, 'src/content/media.generated.json');
const MAX = 1600; // sin ampliar más allá de la resolución original
const NAME = { a: 'ang', h: 'hand', f: 'front', c: 'close' };

/** Fotos que no son cuadradas: `pad` amplía el fondo arriba/abajo; `crop` recorta un cuadrado (x = posición horizontal 0–1). */
const CONFIG = {
  'pu08-a': { fit: 'pad' },
  'pu08-f': { fit: 'pad' },
  'pu08-h': { fit: 'crop', x: 0.11 },
  'pu08-c': { fit: 'pad', anchor: 'top' },
  'pu10-a': { fit: 'pad' },
  'pu05-c': { fit: 'pad' },
};
const FOCAL = { h: { x: 0.5, y: 0.62 } };

async function square(file, key) {
  const cfg = CONFIG[key];
  const img = sharp(file).rotate();
  const { width: w, height: h } = await img.metadata();
  if (w === h || !cfg) return img.resize(Math.min(MAX, w), Math.min(MAX, w), { fit: 'cover', kernel: 'lanczos3' }).toBuffer();
  if (cfg.fit === 'crop') {
    const side = Math.min(w, h);
    const left = Math.round((w - side) * (cfg.x ?? 0.5));
    const out = Math.min(MAX, side);
    return img.extract({ left, top: 0, width: side, height: side }).resize(out, out, { kernel: 'lanczos3' }).toBuffer();
  }
  const SIZE = Math.min(MAX, w);
  const scaled = await img.resize(SIZE, undefined, { kernel: 'lanczos3' }).toBuffer();
  const sh = (await sharp(scaled).metadata()).height;
  const extra = SIZE - sh;
  const top = cfg.anchor === 'top' ? 0 : Math.floor(extra / 2);
  // Fondo: el borde de la foto repetido y muy difuminado (sin bandas); encima, la foto con los bordes ampliados en degradado.
  const backdrop = await sharp(scaled).extend({ top, bottom: extra - top, extendWith: 'copy' }).blur(48).toBuffer();
  const feather = 70;
  const stops = cfg.anchor === 'top' ? `<stop offset="0" stop-color="#fff"/><stop offset="${1 - feather / sh}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>` : `<stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${feather / sh}" stop-color="#fff"/><stop offset="${1 - feather / sh}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>`;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${sh}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const fg = await sharp(scaled).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  return sharp(backdrop).composite([{ input: fg, top, left: 0 }]).toBuffer();
}

async function meta(buffer) {
  const { width, height } = await sharp(buffer).metadata();
  const blur = await sharp(buffer).resize(14, undefined, { fit: 'inside' }).jpeg({ quality: 42 }).toBuffer();
  const stats = await sharp(buffer).resize(24, 24).stats();
  const [r, g, b] = stats.channels.map((c) => Math.round(c.mean));
  return { width, height, blur: `data:image/jpeg;base64,${blur.toString('base64')}`, tone: `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}` };
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
let n = 0;
for (const f of fs.readdirSync(SRC).sort()) {
  const m = /^(pu\d+)-([ahfc])\.\w+$/.exec(f);
  if (!m) continue;
  const [, id, role] = m;
  const photo = await sharp(await square(path.join(SRC, f), `${id}-${role}`)).sharpen({ sigma: 0.6, m1: 0.6, m2: 1.6 }).jpeg({ quality: 90, mozjpeg: true, progressive: true }).toBuffer();
  const key = `${id}-${NAME[role]}`;
  fs.writeFileSync(path.join(OUT, `${key}.jpg`), photo);
  manifest.images[key] = { src: `/media/products/${key}.jpg`, ...(await meta(photo)), focal: FOCAL[role] ?? { x: 0.5, y: 0.5 } };
  n++;
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✔ ${n} fotos de pulseras → public/media/products (fondo crema original)`);
