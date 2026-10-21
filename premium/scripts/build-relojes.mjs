#!/usr/bin/env node
/**
 * Fotos de los relojes (4 vistas por diseño: frontal, 45°, macro y posterior).
 *   node scripts/build-relojes.mjs [id …]      (sin ids: todos los de MAP)
 *
 * Lee ../fotos/relojes-premium/relojeNN-0{1-frontal|2-45|3-macro|4-posterior}.webp (1408×1760, ya en 4:5) y escribe
 * public/media/products/<id>-{frontal|45|macro|posterior}-<hash>.jpg, actualizando src/content/media.generated.json. Después: npm run seed.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { meta } from './lib/photos.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, '../fotos/relojes-premium');
const OUT = path.join(root, 'public/media/products');
const MANIFEST = path.join(root, 'src/content/media.generated.json');

/** Producto del catálogo → diseño (relojNN) de la carpeta. rw01, rw02 y rw06 son los relojes que ya existían; rw07–rw17 son nuevos. keep: foto anterior que se conserva. */
const MAP = {
  rw01: { n: 10 }, rw02: { n: 11, keep: true }, rw06: { n: 13 },
  rw07: { n: 9 }, rw08: { n: 12 }, rw09: { n: 14 }, rw10: { n: 15 }, rw11: { n: 16 }, rw12: { n: 17 }, rw13: { n: 18 }, rw14: { n: 19 }, rw15: { n: 20 }, rw16: { n: 21 }, rw17: { n: 22 },
};
const VIEWS = [['01-frontal', 'frontal'], ['02-45', '45'], ['03-macro', 'macro'], ['04-posterior', 'posterior']];

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const only = process.argv.slice(2);
for (const [id, { n, keep }] of Object.entries(MAP).filter(([id]) => !only.length || only.includes(id))) {
  // Se retiran las fotos anteriores de la pieza y su recorte automático; con keep se conserva la principal (clave <id> del manifiesto y su archivo).
  const mine = new RegExp(`^${id}[-.]`);
  const keepFile = keep ? path.basename(manifest.images[id].src) : null;
  for (const old of fs.readdirSync(OUT)) if (mine.test(old) && old !== keepFile) fs.rmSync(path.join(OUT, old));
  for (const key of Object.keys(manifest.images)) if (key !== id && mine.test(`${key}.`)) delete manifest.images[key];
  if (!keep) delete manifest.images[id];

  for (const [view, name] of VIEWS) {
    const photo = await sharp(path.join(SRC, `reloj${String(n).padStart(2, '0')}-${view}.webp`)).rotate().jpeg({ quality: 91, mozjpeg: true, progressive: true }).toBuffer();
    const key = `${id}-${name}`;
    const hash = crypto.createHash('sha1').update(photo).digest('hex').slice(0, 7);
    fs.writeFileSync(path.join(OUT, `${key}-${hash}.jpg`), photo);
    manifest.images[key] = { src: `/media/products/${key}-${hash}.jpg`, ...(await meta(photo)), focal: { x: 0.5, y: 0.5 } };
  }
  console.log(`✔ ${id} ← reloj${String(n).padStart(2, '0')}: 4 vistas`);
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
