#!/usr/bin/env node
/**
 * Fotos reales de los collares y su giro 360°.
 *   FFMPEG=/ruta/ffmpeg node scripts/build-collares.mjs [id …]      (sin ids: co01–co19)
 *
 * Lee ../fotos/collares-originales/collar-<id>-{blanco|modelo}.webp y collar-<id>-360.mp4 (el diseño coincide con el id del producto).
 *   · blanco → vertical 4:5 sin deformar (el fondo blanco se amplía arriba y abajo).
 *   · modelo → sin recorte (hasta 1600 px); el punto focal decide qué parte se ve al encuadrar en 4:5.
 *   · 360.mp4 → fotogramas webp (máx. 24, repartidos por igual).
 * Escribe public/media/products/<id>-{base|modelo}-<hash>.jpg y public/media/spin/<id>/…, y actualiza src/content/media.generated.json. Después: npm run seed.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { buildSpin } from './lib/spin.mjs';
import { pad45, plain, meta } from './lib/photos.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, '../fotos/collares-originales');
const OUT = path.join(root, 'public/media/products');
const MANIFEST = path.join(root, 'src/content/media.generated.json');
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';

/** Dónde está el dije en la foto con modelo (0–1); por defecto, centro y algo por debajo. */
const FOCAL = { x: 0.5, y: 0.62 };
const ids = Array.from({ length: 19 }, (_, i) => `co${String(i + 1).padStart(2, '0')}`);
const file = (id, kind, ext = 'webp') => path.join(SRC, `collar-${id}-${kind}.${ext}`);

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
manifest.spin ??= {};
const only = process.argv.slice(2);

for (const id of ids.filter((i) => !only.length || only.includes(i))) {
  for (const [kind, name] of [['blanco', 'base'], ['modelo', 'modelo']]) {
    const raw = name === 'modelo' ? await plain(file(id, kind)) : await pad45(file(id, kind));
    const photo = await sharp(raw).jpeg({ quality: 91, mozjpeg: true, progressive: true }).toBuffer();
    const key = `${id}-${name}`;
    const hash = crypto.createHash('sha1').update(photo).digest('hex').slice(0, 7);
    for (const old of fs.readdirSync(OUT)) if (old.startsWith(`${key}-`)) fs.rmSync(path.join(OUT, old));
    fs.writeFileSync(path.join(OUT, `${key}-${hash}.jpg`), photo);
    manifest.images[key] = { src: `/media/products/${key}-${hash}.jpg`, ...(await meta(photo)), focal: name === 'modelo' ? FOCAL : { x: 0.5, y: 0.5 } };
  }
  // Las fotos anteriores de este producto (ya sin uso) se retiran.
  for (const old of [`${id}.jpg`, `${id}-detail.jpg`]) fs.rmSync(path.join(OUT, old), { force: true });
  delete manifest.images[id];
  delete manifest.images[`${id}-detail`];

  const { count, source, ...spin } = await buildSpin({ id, video: file(id, '360', 'mp4'), root, ffmpeg: FFMPEG });
  manifest.spin[id] = spin;
  console.log(`✔ ${id}: 2 fotos + ${count} fotogramas (de ${source}) ${spin.width}×${spin.height}`);
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
