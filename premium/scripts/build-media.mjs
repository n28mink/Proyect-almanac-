#!/usr/bin/env node
/**
 * Pipeline de imágenes de producto.
 *   SRC_PHOTOS=<carpeta con las fotos originales> node scripts/build-media.mjs
 *
 * Por cada foto curada genera:
 *   - public/media/products/<nombre>.jpg          (máx. 1600 px, mozjpeg, sin sellos ni textos)
 *   - public/media/products/<id>-detail.jpg       (recorte macro 1200×1200 centrado en el sujeto)
 * y escribe metadatos (dimensiones, blur, color dominante, punto focal) en src/content/media.generated.json → images.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { CROPS, CURATED_IDS } from './lib/curation.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.env.SRC_PHOTOS ?? path.join(root, 'assets-src/photos');
const OUT = path.join(root, 'public/media/products');
const MANIFEST = path.join(root, 'src/content/media.generated.json');
const source = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/clover-source.json'), 'utf8'));

fs.mkdirSync(OUT, { recursive: true });

const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
// Las camisas tienen su propio paso (scripts/build-shirts.mjs): se conservan sus entradas.
const shirtIds = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/shirts.json'), 'utf8')).items.map((s) => s.id);
manifest.images = Object.fromEntries(Object.entries(manifest.images ?? {}).filter(([k]) => shirtIds.includes(k.replace(/-detail$/, ''))));

/** Centroide de "atención" (gradiente de luminancia ponderado al centro) → punto focal 0–1. */
async function focalPoint(buffer) {
  const N = 48;
  const { data } = await sharp(buffer).greyscale().resize(N, N, { fit: 'fill' }).raw().toBuffer({ resolveWithObject: true });
  let sx = 0;
  let sy = 0;
  let sw = 0;
  for (let y = 1; y < N - 1; y++) {
    for (let x = 1; x < N - 1; x++) {
      const gx = data[y * N + x + 1] - data[y * N + x - 1];
      const gy = data[(y + 1) * N + x] - data[(y - 1) * N + x];
      const mag = gx * gx + gy * gy;
      const dx = (x / N - 0.5) / 0.42;
      const dy = (y / N - 0.5) / 0.42;
      const prior = Math.exp(-(dx * dx + dy * dy) / 2);
      const w = mag * prior;
      sx += (x / N) * w;
      sy += (y / N) * w;
      sw += w;
    }
  }
  if (sw === 0) return { x: 0.5, y: 0.5 };
  return { x: Math.min(0.75, Math.max(0.25, sx / sw)), y: Math.min(0.75, Math.max(0.25, sy / sw)) };
}

async function meta(buffer) {
  const { width, height } = await sharp(buffer).metadata();
  const blur = await sharp(buffer).resize(14, undefined, { fit: 'inside' }).jpeg({ quality: 42 }).toBuffer();
  const stats = await sharp(buffer).resize(24, 24).stats();
  const [r, g, b] = stats.channels.map((c) => Math.round(c.mean));
  const tone = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  return { width, height, blur: `data:image/jpeg;base64,${blur.toString('base64')}`, tone };
}

let count = 0;
for (const id of CURATED_IDS) {
  const product = source.find((p) => p.id === id);
  if (!product) throw new Error(`Producto ${id} no está en clover-source.json`);

  for (const rel of product.imagenes) {
    const name = path.basename(rel, path.extname(rel));
    const file = path.join(SRC, path.basename(rel));
    if (!fs.existsSync(file)) throw new Error(`Falta la foto original: ${file}`);

    let pipeline = sharp(file).rotate();
    const crop = CROPS[name];
    if (crop) {
      const m = await sharp(file).metadata();
      pipeline = pipeline.extract({
        left: Math.round(m.width * crop.left),
        top: Math.round(m.height * crop.top),
        width: Math.round(m.width * crop.width),
        height: Math.round(m.height * crop.height),
      });
    }
    pipeline = pipeline.resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true });
    const buf = await pipeline.jpeg({ quality: 82, mozjpeg: true, progressive: true }).toBuffer();
    fs.writeFileSync(path.join(OUT, `${name}.jpg`), buf);

    const focal = await focalPoint(buf);
    manifest.images[name] = { src: `/media/products/${name}.jpg`, ...(await meta(buf)), focal };
    count++;
  }

  // Recorte macro (detalle) a partir de la primera foto procesada.
  const first = path.basename(product.imagenes[0], path.extname(product.imagenes[0]));
  const firstBuf = fs.readFileSync(path.join(OUT, `${first}.jpg`));
  const fp = manifest.images[first].focal;
  const m = await sharp(firstBuf).metadata();
  const side = Math.round(Math.min(m.width, m.height) * 0.6);
  const left = Math.min(m.width - side, Math.max(0, Math.round(fp.x * m.width - side / 2)));
  const top = Math.min(m.height - side, Math.max(0, Math.round(fp.y * m.height - side / 2)));
  const detail = await sharp(firstBuf)
    .extract({ left, top, width: side, height: side })
    .resize(1200, 1200, { kernel: 'lanczos3' })
    .sharpen({ sigma: 0.7, m1: 0.6, m2: 1.2 })
    .jpeg({ quality: 80, mozjpeg: true, progressive: true })
    .toBuffer();
  fs.writeFileSync(path.join(OUT, `${id}-detail.jpg`), detail);
  manifest.images[`${id}-detail`] = { src: `/media/products/${id}-detail.jpg`, ...(await meta(detail)), focal: { x: 0.5, y: 0.5 } };
  count++;
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✔ ${count} imágenes procesadas → public/media/products · metadatos en src/content/media.generated.json`);
