#!/usr/bin/env node
/**
 * Foto principal de los relojes sobre el fondo de marca.
 *   node scripts/build-watches.mjs
 *
 * Lee los recortes de ../assets-src/watches/<id>.png (reloj sin fondo) y los monta sobre el mismo fondo en todos:
 * verde pálido #edf4ef (--color-bone) con un brillo central #fafcf8 que se funde hacia los bordes, más una sombra
 * suave debajo. Escribe public/media/products/<id>-bone.jpg y actualiza sus metadatos en src/content/media.generated.json.
 * Las fotos secundarias (…-2, …-3, detalle) no se tocan.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, '../assets-src/watches');
const OUT = path.join(root, 'public/media/products');
const MANIFEST = path.join(root, 'src/content/media.generated.json');

const BASE = '#edf4ef';
const GLOW = '#fafcf8';
const SIZE = 1200;

const backdrop = () =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}"><defs>` +
      `<radialGradient id="g" cx="50%" cy="47%" r="62%"><stop offset="0" stop-color="${GLOW}"/><stop offset="1" stop-color="${BASE}"/></radialGradient>` +
      `</defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`,
  );

async function meta(buffer) {
  const { width, height } = await sharp(buffer).metadata();
  const blur = await sharp(buffer).resize(14, undefined, { fit: 'inside' }).jpeg({ quality: 42 }).toBuffer();
  const stats = await sharp(buffer).resize(24, 24).stats();
  const [r, g, b] = stats.channels.map((c) => Math.round(c.mean));
  const tone = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  return { width, height, blur: `data:image/jpeg;base64,${blur.toString('base64')}`, tone };
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const ids = fs.readdirSync(SRC).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, '')).sort();

for (const id of ids) {
  const cut = await sharp(path.join(SRC, `${id}.png`)).resize(SIZE, SIZE, { fit: 'fill', kernel: 'lanczos3' }).ensureAlpha().png().toBuffer();
  const alpha = await sharp(cut).extractChannel('alpha').blur(22).linear(0.2, 0).toBuffer();
  const shadow = await sharp({ create: { width: SIZE, height: SIZE, channels: 3, background: '#223c2c' } }).joinChannel(alpha).png().toBuffer();
  const photo = await sharp(backdrop())
    .composite([{ input: shadow, top: 16, left: 0 }, { input: cut, top: 0, left: 0 }])
    .jpeg({ quality: 86, mozjpeg: true, progressive: true })
    .toBuffer();
  // Nombre propio (`-bone`): la caché de imágenes de Vercel guarda cada URL hasta 30 días, así que un nombre nuevo evita fotos viejas.
  fs.writeFileSync(path.join(OUT, `${id}-bone.jpg`), photo);
  fs.rmSync(path.join(OUT, `${id}.jpg`), { force: true });
  const prev = manifest.images?.[id];
  manifest.images[id] = { src: `/media/products/${id}-bone.jpg`, ...(await meta(photo)), focal: prev?.focal ?? { x: 0.5, y: 0.5 } };
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✔ ${ids.length} fotos principales de relojes → public/media/products (${BASE} con brillo ${GLOW})`);
