#!/usr/bin/env node
/**
 * Fotos de los relojes (4 vistas por diseño: frontal, 45°, macro y posterior).
 *   node scripts/build-relojes.mjs [id …]      (sin ids: todos los de JOBS)
 *
 * Lee ../fotos/relojes-premium/<origen>-0{1-frontal|2-45|3-macro|4-posterior}.webp y escribe
 * public/media/products/<clave>-{frontal|45|macro|posterior}-<hash>.jpg, actualizando src/content/media.generated.json. Después: npm run seed.
 *   · Las fotos en 4:5 se guardan tal cual; las cuadradas (1:1) se llevan a 4:5 ampliando el fondo (frontal, 45° y posterior) o se dejan
 *     sin recorte (macro; el encuadre lo hace object-cover).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { meta, pad45, plain } from './lib/photos.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, '../fotos/relojes-premium');
const OUT = path.join(root, 'public/media/products');
const MANIFEST = path.join(root, 'src/content/media.generated.json');

/**
 * Cada trabajo: producto (id), prefijo del archivo de origen (src), clave de las fotos nuevas (key, por defecto el id),
 * limpiar las fotos anteriores del producto (clean) y las claves anteriores que se conservan (keep: fotos de otras variantes).
 * rw01, rw02 y rw06 → reloj10, reloj11 y reloj13; rw07 y rw10–rw14 son diseños nuevos (reloj09, reloj15–reloj19); rw03, rw04, rw05 (dos variantes) y st01 traen su propio prefijo.
 */
const JOBS = [
  { id: 'rw01', src: 'reloj10' }, { id: 'rw02', src: 'reloj11', keep: ['rw02'] }, { id: 'rw06', src: 'reloj13' },
  { id: 'rw07', src: 'reloj09' }, { id: 'rw10', src: 'reloj15' }, { id: 'rw11', src: 'reloj16' },
  { id: 'rw12', src: 'reloj17' }, { id: 'rw13', src: 'reloj18' }, { id: 'rw14', src: 'reloj19' },
  // reloj20 y reloj21 no son productos aparte: son la variante azul de rw03 y la verde de st01 (sus fotos se usan como variantes en build-seed.mjs).
  { id: 'rw15', src: 'reloj20' }, { id: 'rw16', src: 'reloj21' },
  { id: 'rw03', src: 'rw03', keep: ['rw03-2', 'rw03-4', 'rw03-5'] },
  { id: 'rw04', src: 'rw04' },
  { id: 'rw05', src: 'rw05a' },
  { id: 'rw05', src: 'rw05b', key: 'rw05b', clean: false },
  { id: 'st01', src: 'st01', keep: ['st01', 'st01-2'] },
];
/** Foto más estrecha que 4:5: se recorta a 4:5 desde el centro (se pierde solo correa arriba y abajo; rellenar los lados dejaba bandas por la viñeta del fondo). */
async function recortar45(file) {
  const base = await sharp(file).rotate().toBuffer();
  const { width, height } = await sharp(base).metadata();
  const h = Math.min(height, Math.round(width * 1.25));
  return sharp(base).extract({ left: 0, top: Math.floor((height - h) / 2), width, height: h }).toBuffer();
}
/** Diseños que eran el mismo reloj que rw05 (reloj12, reloj14) y que el de st01 con esfera blanca (reloj22): se retiran sus fotos. */
const RETIRED = ['rw08', 'rw09', 'rw17'];
const VIEWS = [['01-frontal', 'frontal'], ['02-45', '45'], ['03-macro', 'macro'], ['04-posterior', 'posterior']];

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const only = process.argv.slice(2);
for (const id of RETIRED) {
  for (const old of fs.readdirSync(OUT)) if (old.startsWith(`${id}-`)) fs.rmSync(path.join(OUT, old));
  for (const key of Object.keys(manifest.images)) if (key.startsWith(`${id}-`)) delete manifest.images[key];
}
for (const { id, src, key: base = id, clean = true, keep = [] } of JOBS.filter((j) => !only.length || only.includes(j.id))) {
  if (clean) {
    // Se retiran las fotos anteriores de la pieza y su recorte automático, salvo las de otras variantes (keep).
    const mine = new RegExp(`^${id}[-.]`);
    const keepFiles = new Set(keep.map((k) => path.basename(manifest.images[k].src)));
    for (const old of fs.readdirSync(OUT)) if (mine.test(old) && !keepFiles.has(old)) fs.rmSync(path.join(OUT, old));
    for (const k of Object.keys(manifest.images)) if ((k === id || mine.test(`${k}.`)) && !keep.includes(k)) delete manifest.images[k];
  }

  for (const [view, name] of VIEWS) {
    const file = path.join(SRC, `${src}-${view}.webp`);
    const { width, height } = await sharp(file).metadata();
    const ratio = width / height;
    // 4:5 → tal cual; más estrecha que 4:5 → se recorta desde el centro; cuadrada → macro tal cual, el resto con fondo arriba y abajo.
    const raw = Math.abs(ratio - 0.8) < 0.03 || (name === 'macro' && ratio >= 0.77) ? await plain(file)
      : ratio < 0.77 ? await recortar45(file)
      : await pad45(file);
    const photo = await sharp(raw).jpeg({ quality: 91, mozjpeg: true, progressive: true }).toBuffer();
    const key = `${base}-${name}`;
    const hash = crypto.createHash('sha1').update(photo).digest('hex').slice(0, 7);
    for (const old of fs.readdirSync(OUT)) if (old.startsWith(`${key}-`)) fs.rmSync(path.join(OUT, old));
    fs.writeFileSync(path.join(OUT, `${key}-${hash}.jpg`), photo);
    manifest.images[key] = { src: `/media/products/${key}-${hash}.jpg`, ...(await meta(photo)), focal: { x: 0.5, y: 0.5 } };
  }
  console.log(`✔ ${id}${base !== id ? ` (${base})` : ''} ← ${src}: 4 vistas`);
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
