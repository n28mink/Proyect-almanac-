#!/usr/bin/env node
/**
 * Fotos reales de collares, pulseras y anillos, y su giro 360°.
 *   FFMPEG=/ruta/ffmpeg node scripts/build-set.mjs <collares|pulseras|anillos> [id …]      (sin ids: todos los del juego)
 *
 * Lee ../fotos/<juego>-originales/<prefijo>-<id>-{blanco|modelo}.webp y <prefijo>-<id>-360.mp4 (el diseño coincide con el id del producto).
 *   · blanco → vertical 4:5 sin deformar (el fondo blanco se amplía arriba y abajo).
 *   · modelo → sin recorte (hasta 1600 px); el punto focal decide qué parte se ve al encuadrar en 4:5.
 *   · 360.mp4 → fotogramas webp (máx. 24, repartidos por igual).
 * Escribe public/media/products/<id>-{base|modelo}-<hash>.jpg y public/media/spin/<id>/…, retira las fotos anteriores de la pieza
 * y actualiza src/content/media.generated.json. Después: npm run seed.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { buildSpin } from './lib/spin.mjs';
import { pad45, plain, meta } from './lib/photos.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'public/media/products');
const MANIFEST = path.join(root, 'src/content/media.generated.json');
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const range = (p, n) => Array.from({ length: n }, (_, i) => `${p}${String(i + 1).padStart(2, '0')}`);

/** focal: dónde está la joya en la foto con modelo (0–1). sinModelo: piezas cuya foto con modelo no se publica. */
const SETS = {
  collares: { dir: 'collares-originales', prefix: 'collar', ids: range('co', 19), focal: { x: 0.5, y: 0.62 } },
  // pu01 es un anillo ancho (la foto con modelo lo muestra en la muñeca): solo foto en blanco y 360°.
  pulseras: { dir: 'pulseras-originales', prefix: 'pulsera', ids: range('pu', 13), focal: { x: 0.5, y: 0.7 }, sinModelo: ['pu01'] },
  anillos: { dir: 'anillos-originales', prefix: 'anillo', ids: range('an', 12), focal: { x: 0.5, y: 0.6 } },
};

const [setName, ...only] = process.argv.slice(2);
const set = SETS[setName];
if (!set) {
  console.error(`Uso: node scripts/build-set.mjs <${Object.keys(SETS).join('|')}> [id …]`);
  process.exit(1);
}
const SRC = path.join(root, '../fotos', set.dir);
const file = (id, kind, ext = 'webp') => path.join(SRC, `${set.prefix}-${id}-${kind}.${ext}`);

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
manifest.spin ??= {};

for (const id of set.ids.filter((i) => !only.length || only.includes(i))) {
  // Se retiran las fotos anteriores de la pieza (archivos y claves del manifiesto: <id>.jpg, <id>-detail, <id>-ang…).
  const mine = new RegExp(`^${id}[-.]`);
  for (const old of fs.readdirSync(OUT)) if (mine.test(old)) fs.rmSync(path.join(OUT, old));
  delete manifest.images[id];
  for (const key of Object.keys(manifest.images)) if (mine.test(`${key}.`)) delete manifest.images[key];

  const kinds = [['blanco', 'base'], ...(set.sinModelo?.includes(id) ? [] : [['modelo', 'modelo']])];
  for (const [kind, name] of kinds) {
    const raw = name === 'modelo' ? await plain(file(id, kind)) : await pad45(file(id, kind));
    const photo = await sharp(raw).jpeg({ quality: 91, mozjpeg: true, progressive: true }).toBuffer();
    const key = `${id}-${name}`;
    const hash = crypto.createHash('sha1').update(photo).digest('hex').slice(0, 7);
    fs.writeFileSync(path.join(OUT, `${key}-${hash}.jpg`), photo);
    manifest.images[key] = { src: `/media/products/${key}-${hash}.jpg`, ...(await meta(photo)), focal: name === 'modelo' ? set.focal : { x: 0.5, y: 0.5 } };
  }

  const { count, source, ...spin } = await buildSpin({ id, video: file(id, '360', 'mp4'), root, ffmpeg: FFMPEG });
  manifest.spin[id] = spin;
  console.log(`✔ ${id}: ${kinds.length} foto(s) + ${count} fotogramas (de ${source}) ${spin.width}×${spin.height}`);
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
