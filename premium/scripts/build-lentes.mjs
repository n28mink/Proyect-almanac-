#!/usr/bin/env node
/**
 * Fotos de los lentes de sol (4 por modelo: frente, perfil, detalle de la bisagra y modelo).
 *   node scripts/build-lentes.mjs [id …]      (sin ids: le01–le10)
 *
 * Lee ../fotos/lentes-originales/<id>-{frente|perfil|detalle|modelo}.webp y escribe
 * public/media/products/<id>-{frente|perfil|macro|modelo}-<hash>.jpg, actualizando src/content/media.generated.json. Después: npm run seed.
 *   · frente y perfil (cuadradas o 3:2): se llevan a 4:5 ampliando el fondo.
 *   · detalle: sin recorte; el encuadre lo hace object-cover con el foco en la bisagra (derecha de la foto).
 *   · modelo: ya viene en 4:5.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { meta, pad45, plain } from './lib/photos.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, '../fotos/lentes-originales');
const OUT = path.join(root, 'public/media/products');
const MANIFEST = path.join(root, 'src/content/media.generated.json');
const IDS = Array.from({ length: 10 }, (_, i) => `le${String(i + 1).padStart(2, '0')}`);
const VIEWS = [['frente', 'frente', 'pad'], ['perfil', 'perfil', 'pad'], ['detalle', 'macro', 'plain'], ['modelo', 'modelo', 'plain']];

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const only = process.argv.slice(2);
for (const id of IDS.filter((i) => !only.length || only.includes(i))) {
  const mine = new RegExp(`^${id}[-.]`);
  for (const old of fs.readdirSync(OUT)) if (mine.test(old)) fs.rmSync(path.join(OUT, old));
  for (const key of Object.keys(manifest.images)) if (mine.test(`${key}.`)) delete manifest.images[key];

  for (const [view, name, mode] of VIEWS) {
    const file = path.join(SRC, `${id}-${view}.webp`);
    const raw = mode === 'pad' ? await pad45(file) : await plain(file);
    const photo = await sharp(raw).jpeg({ quality: 91, mozjpeg: true, progressive: true }).toBuffer();
    const key = `${id}-${name}`;
    const hash = crypto.createHash('sha1').update(photo).digest('hex').slice(0, 7);
    fs.writeFileSync(path.join(OUT, `${key}-${hash}.jpg`), photo);
    const focal = name === 'macro' ? { x: 0.72, y: 0.5 } : name === 'modelo' ? { x: 0.5, y: 0.4 } : { x: 0.5, y: 0.5 };
    manifest.images[key] = { src: `/media/products/${key}-${hash}.jpg`, ...(await meta(photo)), focal };
  }
  console.log(`✔ ${id}: 4 vistas`);
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
