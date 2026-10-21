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
  // Anillos: la foto con modelo se encuadra más cerca del anillo (centro aproximado de cada uno en la foto, 0–1) y el close-up es la foto real
  // del proveedor (../fotos/<id>.jpg, con la pieza grande y el fondo original).
  anillos: {
    dir: 'anillos-originales', prefix: 'anillo', ids: range('an', 12), focal: { x: 0.5, y: 0.5 }, closeup: true,
    zoom: 0.58,
    centro: {
      an01: { x: 0.46, y: 0.38 }, an02: { x: 0.59, y: 0.45 }, an03: { x: 0.5, y: 0.5 }, an04: { x: 0.55, y: 0.47 },
      an05: { x: 0.5, y: 0.47 }, an06: { x: 0.58, y: 0.52 }, an07: { x: 0.52, y: 0.46 }, an08: { x: 0.42, y: 0.45 },
      an09: { x: 0.48, y: 0.42 }, an10: { x: 0.48, y: 0.46 }, an11: { x: 0.61, y: 0.41 }, an12: { x: 0.49, y: 0.41 },
    },
  },
};

/** Recorta la foto con modelo a 4:5 centrada en la joya (ancho = zoom del lado), sin ampliar. */
async function acercar(f, c, zoom) {
  const img = sharp(f).rotate();
  const { width: W, height: H } = await img.metadata();
  const w = Math.round(W * zoom);
  const h = Math.min(H, Math.round(w * 1.25));
  const left = Math.max(0, Math.min(W - w, Math.round(c.x * W - w / 2)));
  const top = Math.max(0, Math.min(H - h, Math.round(c.y * H - h / 2)));
  return img.extract({ left, top, width: w, height: h }).toBuffer();
}

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

  const kinds = [['blanco', 'base'], ...(set.sinModelo?.includes(id) ? [] : [['modelo', 'modelo']]), ...(set.closeup ? [['closeup', 'macro']] : [])];
  for (const [kind, name] of kinds) {
    const raw = kind === 'closeup' ? await plain(path.join(root, '../fotos', `${id}.jpg`))
      : name === 'modelo' ? (set.centro ? await acercar(file(id, kind), set.centro[id], set.zoom) : await plain(file(id, kind)))
      : await pad45(file(id, kind));
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
