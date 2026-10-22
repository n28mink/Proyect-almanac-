#!/usr/bin/env node
/**
 * Fotos de las camisas (5 por diseño: en el cuerpo, plana, close-up, otro ángulo y posterior).
 *   node scripts/build-camisas.mjs [id …]      (sin ids: todas las de shirts.json)
 *
 * Lee ../fotos/camisas-originales/<id>-0{1-cuerpo|2-flatlay|3-closeup|4-otro-angulo|5-posterior}.webp (1408×1760, ya en 4:5) y escribe
 * public/media/products/<id>-{cuerpo|flatlay|closeup|otro|posterior}-<hash>.jpg, actualizando src/content/media.generated.json.
 * Retira las fotos anteriores de la camisa (<id>, <id>-back, <id>-detail). Después: npm run seed.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { meta, plain } from './lib/photos.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, '../fotos/camisas-originales');
const OUT = path.join(root, 'public/media/products');
const MANIFEST = path.join(root, 'src/content/media.generated.json');
const VIEWS = [['01-cuerpo', 'cuerpo'], ['02-flatlay', 'flatlay'], ['03-closeup', 'closeup'], ['04-otro-angulo', 'otro'], ['05-posterior', 'posterior']];

const shirts = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/shirts.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const only = process.argv.slice(2);

for (const { id } of shirts.items.filter((s) => !only.length || only.includes(s.id))) {
  const mine = new RegExp(`^${id}[-.]`);
  for (const old of fs.readdirSync(OUT)) if (mine.test(old)) fs.rmSync(path.join(OUT, old));
  delete manifest.images[id];
  for (const key of Object.keys(manifest.images)) if (mine.test(`${key}.`)) delete manifest.images[key];

  for (const [view, name] of VIEWS) {
    const photo = await sharp(await plain(path.join(SRC, `${id}-${view}.webp`))).jpeg({ quality: 90, mozjpeg: true, progressive: true }).toBuffer();
    const key = `${id}-${name}`;
    const hash = crypto.createHash('sha1').update(photo).digest('hex').slice(0, 7);
    fs.writeFileSync(path.join(OUT, `${key}-${hash}.jpg`), photo);
    manifest.images[key] = { src: `/media/products/${key}-${hash}.jpg`, ...(await meta(photo)), focal: { x: 0.5, y: name === 'cuerpo' || name === 'otro' ? 0.35 : 0.5 } };
  }
  console.log(`✔ ${id}: 5 fotos`);
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
