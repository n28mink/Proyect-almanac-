#!/usr/bin/env node
/**
 * Fotos de las camisas.
 *   node scripts/build-shirts.mjs
 *
 * Lee las fotos maestras de assets-src/shirts/<id>.jpg (la camisa ya recortada sobre el fondo salvia de la marca)
 * y genera public/media/products/<id>.jpg + <id>-detail.jpg (recorte del estampado). Añade sus metadatos a
 * src/content/media.generated.json → images sin tocar las fotos de joyería.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'assets-src/shirts');
const OUT = path.join(root, 'public/media/products');
const MANIFEST = path.join(root, 'src/content/media.generated.json');
const shirts = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/shirts.json'), 'utf8'));

async function meta(buffer) {
  const { width, height } = await sharp(buffer).metadata();
  const blur = await sharp(buffer).resize(14, undefined, { fit: 'inside' }).jpeg({ quality: 42 }).toBuffer();
  const stats = await sharp(buffer).resize(24, 24).stats();
  const [r, g, b] = stats.channels.map((c) => Math.round(c.mean));
  const tone = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  return { width, height, blur: `data:image/jpeg;base64,${blur.toString('base64')}`, tone };
}

fs.mkdirSync(OUT, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
manifest.images ??= {};

for (const s of shirts.items) {
  const file = path.join(SRC, `${s.id}.jpg`);
  if (!fs.existsSync(file)) throw new Error(`Falta la foto maestra: ${file}`);

  const main = await sharp(file).resize({ width: 1000, height: 1250, fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true, progressive: true }).toBuffer();
  fs.writeFileSync(path.join(OUT, `${s.id}.jpg`), main);
  manifest.images[s.id] = { src: `/media/products/${s.id}.jpg`, ...(await meta(main)), focal: { x: 0.5, y: 0.45 } };

  // Detalle: sin ampliar más de 1,5× para que el estampado no se vea blando.
  const [left, top, side] = s.detail;
  const out = Math.min(1000, Math.round(side * 1.5));
  const detail = await sharp(file)
    .extract({ left, top, width: side, height: side })
    .resize(out, out, { kernel: 'lanczos3' })
    .sharpen({ sigma: 0.6, m1: 0.5, m2: 1 })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true })
    .toBuffer();
  fs.writeFileSync(path.join(OUT, `${s.id}-detail.jpg`), detail);
  manifest.images[`${s.id}-detail`] = { src: `/media/products/${s.id}-detail.jpg`, ...(await meta(detail)), focal: { x: 0.5, y: 0.5 } };
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✔ ${shirts.items.length * 2} imágenes de camisas → public/media/products`);
