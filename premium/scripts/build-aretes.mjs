#!/usr/bin/env node
/**
 * Fotos reales de los aretes flor (ar11) y su giro 360°.
 *   FFMPEG=/ruta/ffmpeg node scripts/build-aretes.mjs
 *
 * Lee assets-src/aretes/ar11-par|individual|modelo.png y ar11-360.mp4. Las fotos se llevan a vertical 4:5 sin deformar
 * (par/individual: fondo ampliado y difuminado; modelo: recorte centrado en la oreja) y el vídeo se descompone en fotogramas webp.
 * Escribe public/media/products/ar11-*-<hash>.jpg, public/media/spin/ar11/f01…webp y actualiza src/content/media.generated.json
 * (images.ar11-par|individual|modelo y spin.ar11). Después: npm run seed.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'assets-src/aretes');
const OUT = path.join(root, 'public/media/products');
const SPIN = path.join(root, 'public/media/spin/ar11');
const MANIFEST = path.join(root, 'src/content/media.generated.json');
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const RATIO = 4 / 5;

async function portrait(file, mode) {
  const img = sharp(file).rotate();
  const { width: w, height: h } = await img.metadata();
  if (mode === 'crop') {
    const cw = Math.round(h * RATIO);
    return img.extract({ left: Math.min(w - cw, Math.max(0, Math.round(w * 0.5 - cw * 0.55))), top: 0, width: cw, height: h }).toBuffer();
  }
  const H = Math.round(w / RATIO);
  const extra = H - h;
  const top = Math.floor(extra / 2);
  const buf = await img.toBuffer();
  // Fondo liso con el blanco de estudio (franja lateral limpia, a un cuarto de altura): el borde real de la foto es más oscuro (viñeta),
  // así que la foto se funde con un degradado largo en vez de dejar una banda.
  const edge = async (top) => {
    const strip = await sharp(buf).extract({ left: 0, top: Math.round(h * (top ? 0.2 : 0.8)), width: 120, height: 12 }).raw().toBuffer(); // stats() sobre un extract ignora el recorte
    const st = await sharp(strip, { raw: { width: 120, height: 12, channels: 3 } }).stats();
    return `rgb(${st.channels.slice(0, 3).map((c) => Math.round(c.mean)).join(',')})`;
  };
  const backdrop = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="${top / H}" stop-color="${await edge(true)}"/><stop offset="${(top + h) / H}" stop-color="${await edge(false)}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#b)"/></svg>`)).png().toBuffer();
  const feather = Math.round(h * 0.18);
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${feather / h}" stop-color="#fff"/><stop offset="${1 - feather / h}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const fg = await sharp(buf).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
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
for (const [name, mode] of [['par', 'pad'], ['individual', 'pad'], ['modelo', 'crop']]) {
  const photo = await sharp(await portrait(path.join(SRC, `ar11-${name}.png`), mode)).jpeg({ quality: 93, mozjpeg: true, progressive: true }).toBuffer();
  const key = `ar11-${name}`;
  const hash = crypto.createHash('sha1').update(photo).digest('hex').slice(0, 7);
  for (const old of fs.readdirSync(OUT)) if (old.startsWith(`${key}-`)) fs.rmSync(path.join(OUT, old));
  fs.writeFileSync(path.join(OUT, `${key}-${hash}.jpg`), photo);
  manifest.images[key] = { src: `/media/products/${key}-${hash}.jpg`, ...(await meta(photo)), focal: name === 'modelo' ? { x: 0.5, y: 0.62 } : { x: 0.5, y: 0.5 } };
}

// Giro 360°: fotogramas del vídeo (la resolución de origen; solo hay los que traiga el vídeo).
const tmp = fs.mkdtempSync(path.join(root, 'node_modules/.spin-'));
execFileSync(FFMPEG, ['-v', 'error', '-i', path.join(SRC, 'ar11-360.mp4'), '-vsync', '0', path.join(tmp, 'f%02d.png')]);
// Los 2 primeros fotogramas del vídeo de 24 salen más pequeños que el resto (la cámara aún no se ha asentado): se descartan para que la vuelta cierre limpia.
const files = fs.readdirSync(tmp).filter((f) => f.endsWith('.png')).sort().slice(2);
const tag = crypto.createHash('sha1');
const bufs = [];
for (const f of files) {
  const b = await sharp(path.join(tmp, f)).webp({ quality: 86, effort: 5 }).toBuffer();
  tag.update(b);
  bufs.push(b);
}
const hash = tag.digest('hex').slice(0, 7);
fs.rmSync(SPIN, { recursive: true, force: true });
fs.mkdirSync(SPIN, { recursive: true });
bufs.forEach((b, i) => fs.writeFileSync(path.join(SPIN, `f${String(i + 1).padStart(2, '0')}-${hash}.webp`), b));
const first = await sharp(path.join(tmp, files[0])).metadata();
// Color de las bandas de la caja 4:5: el del borde del fotograma (esquina), no la media de toda la imagen.
const rawCorner = await sharp(path.join(tmp, files[0])).extract({ left: 0, top: 0, width: 24, height: 24 }).removeAlpha().raw().toBuffer();
const cs = await sharp(rawCorner, { raw: { width: 24, height: 24, channels: 3 } }).stats();
const m0 = { tone: `#${cs.channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, '0')).join('')}` };
fs.rmSync(tmp, { recursive: true, force: true });
manifest.spin = { ...(manifest.spin ?? {}), ar11: { frames: bufs.map((_, i) => `/media/spin/ar11/f${String(i + 1).padStart(2, '0')}-${hash}.webp`), width: first.width, height: first.height, tone: m0.tone } };
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✔ ar11: 3 fotos + ${files.length} fotogramas 360° (${first.width}×${first.height})`);
