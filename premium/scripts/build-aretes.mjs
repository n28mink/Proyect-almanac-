#!/usr/bin/env node
/**
 * Fotos reales de los aretes (sin comprimir) y su giro 360°.
 *   FFMPEG=/ruta/ffmpeg node scripts/build-aretes.mjs [id …]      (sin ids: todos los de MAP)
 *
 * Lee ../fotos/aretes-originales/arete-<diseño>-{base|par|individual|macro|modelo-cerca|360-par}.{png|mp4}.
 *   · base / par / individual → vertical 4:5 sin deformar: el fondo de estudio se amplía arriba y abajo con un degradado largo.
 *   · macro / modelo-cerca    → sin recorte (hasta 1600 px); el punto focal (FOCAL) decide qué parte se ve al encuadrar en 4:5.
 *   · 360-par.mp4             → fotogramas webp (todos los del vídeo).
 * Escribe public/media/products/<id>-<tipo>-<hash>.jpg y public/media/spin/<id>/fNN-<hash>.webp, y actualiza
 * src/content/media.generated.json (images.<id>-<tipo> y spin.<id>). Después: npm run seed.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { buildSpin } from './lib/spin.mjs';
import { pad45, plain, meta } from './lib/photos.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, '../fotos/aretes-originales');
const OUT = path.join(root, 'public/media/products');
const MANIFEST = path.join(root, 'src/content/media.generated.json');
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';

/** Producto del catálogo → diseño de la carpeta de originales (los 32 diseños nuevos: 30 son aretes que el catálogo original ya tenía, ar54 y ar55 son piezas nuevas), y dónde está el arete en la foto con modelo (0–1). */
const MAP = {
  ar03: { slug: 'oval-trenzado-dorado', focal: { x: 0.56, y: 0.5 } },
  ar04: { slug: 'argolla-corazones-plateada', focal: { x: 0.45, y: 0.5 } },
  ar05: { slug: 'nudo-esmaltado-dorado', focal: { x: 0.46, y: 0.5 } },
  ar06: { slug: 'doble-aro-dorado', focal: { x: 0.59, y: 0.5 } },
  ar07: { slug: 'argolla-acanalada-dorada', focal: { x: 0.44, y: 0.5 } },
  ar08: { slug: 'herradura-dorada', focal: { x: 0.43, y: 0.5 } },
  ar09: { slug: 'argolla-facetada-plateada', focal: { x: 0.46, y: 0.5 } },
  ar10: { slug: 'rect-dorado', focal: { x: 0.54, y: 0.5 } },
  ar11: { slug: 'flor', focal: { x: 0.52, y: 0.5 } },
  ar12: { slug: 'onda-dorada', focal: { x: 0.5, y: 0.5 } },
  ar14: { slug: 'gota-argolla-plateada', focal: { x: 0.51, y: 0.5 } },
  ar15: { slug: 'punto-piedra-plateada', focal: { x: 0.37, y: 0.5 } },
  ar27: { slug: 'espiral-dorada', focal: { x: 0.51, y: 0.5 } },
  ar28: { slug: 'argolla-martillada-dorada', focal: { x: 0.51, y: 0.5 } },
  ar29: { slug: 'gota-nacar-dorada', focal: { x: 0.49, y: 0.5 } },
  ar30: { slug: 'flor-turquesa', focal: { x: 0.52, y: 0.5 } },
  ar32: { slug: 'flor-estriada-dorada', focal: { x: 0.47, y: 0.5 } },
  ar34: { slug: 'argolla-lazo-plateada', focal: { x: 0.46, y: 0.5 } },
  ar36: { slug: 'hex-bambu-dorado', focal: { x: 0.42, y: 0.5 } },
  ar37: { slug: 'ginkgo-perla', focal: { x: 0.39, y: 0.5 } },
  ar39: { slug: 'concha-perlas', focal: { x: 0.57, y: 0.55 } },
  ar45: { slug: 'nudo-dorado', focal: { x: 0.42, y: 0.5 } },
  ar01: { slug: 'disco-ondulado-plateado', focal: { x: 0.45, y: 0.5 } },
  ar02: { slug: 'doble-gota-dorada', focal: { x: 0.52, y: 0.5 } },
  ar13: { slug: 'vieira-dorada', focal: { x: 0.41, y: 0.5 } },
  ar16: { slug: 'estrella-mar', focal: { x: 0.47, y: 0.5 } },
  ar17: { slug: 'ala-dorada', focal: { x: 0.56, y: 0.5 } },
  ar18: { slug: 'rect-acanalado-dorado', focal: { x: 0.47, y: 0.5 } },
  ar19: { slug: 'nautilo-perla-dorada', focal: { x: 0.34, y: 0.5 } },
  ar20: { slug: 'cuad-acolchado-dorado', focal: { x: 0.41, y: 0.5 } },
  ar21: { slug: 'flor-oscura', focal: { x: 0.5, y: 0.5 } },
  ar22: { slug: 'nudo-plateado', focal: { x: 0.5, y: 0.5 } },
  ar23: { slug: 'rect-banda-dorada', focal: { x: 0.42, y: 0.5 } },
  ar24: { slug: 'disco-perla-dorada', focal: { x: 0.45, y: 0.5 } },
  ar25: { slug: 'hoja-perla', focal: { x: 0.39, y: 0.5 } },
  ar26: { slug: 'argolla-oval-dorada', focal: { x: 0.53, y: 0.5 } },
  ar31: { slug: 'rect-borde-plateado', focal: { x: 0.55, y: 0.5 } },
  ar33: { slug: 'abanico-plateado', focal: { x: 0.57, y: 0.5 } },
  ar35: { slug: 'flor-plisada-dorada', focal: { x: 0.4, y: 0.5 } },
  ar38: { slug: 'flor-mini-plateada', focal: { x: 0.43, y: 0.5 } },
  ar40: { slug: 'argolla-chunky-plateada', focal: { x: 0.45, y: 0.5 } },
  ar41: { slug: 'hex-dorado', focal: { x: 0.54, y: 0.5 } },
  ar42: { slug: 'remolino-perla-dorada', focal: { x: 0.51, y: 0.5 } },
  ar43: { slug: 'cono-dorado', focal: { x: 0.45, y: 0.5 } },
  ar44: { slug: 'gota-plateada', focal: { x: 0.42, y: 0.5 } },
  ar47: { slug: 'domo-plateado', focal: { x: 0.54, y: 0.5 } },
  ar48: { slug: 'cuad-estriado-dorado', focal: { x: 0.47, y: 0.5 } },
  ar49: { slug: 'corazon-dorado', focal: { x: 0.48, y: 0.5 } },
  ar50: { slug: 'margarita-plateada', focal: { x: 0.51, y: 0.5 } },
  ar51: { slug: 'cuad-plateado', focal: { x: 0.5, y: 0.5 } },
  ar52: { slug: 'sol-perla-dorada', focal: { x: 0.44, y: 0.5 } },
  ar53: { slug: 'flor-5petalos', focal: { x: 0.56, y: 0.5 } },
  ar54: { slug: 'concha-dorada', focal: { x: 0.5, y: 0.5 } },
  ar55: { slug: 'rosa-perla-dorada', focal: { x: 0.47, y: 0.5 } },
};

const file = (slug, kind, ext = 'png') => path.join(SRC, `arete-${slug}-${kind}.${ext}`);

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
manifest.spin ??= {};
const only = process.argv.slice(2);
const ids = Object.keys(MAP).filter((id) => !only.length || only.includes(id));

for (const id of ids) {
  const { slug, focal } = MAP[id];
  // Los primeros diseños traen par + individual; el resto, base + macro.
  const kinds = fs.existsSync(file(slug, 'base')) ? ['base', 'modelo-cerca', 'macro'] : ['par', 'individual', 'modelo-cerca'];
  for (const kind of kinds) {
    const raw = ['modelo-cerca', 'macro'].includes(kind) ? await plain(file(slug, kind)) : await pad45(file(slug, kind));
    const photo = await sharp(raw).jpeg({ quality: 91, mozjpeg: true, progressive: true }).toBuffer();
    const name = kind === 'modelo-cerca' ? 'modelo' : kind;
    const key = `${id}-${name}`;
    const hash = crypto.createHash('sha1').update(photo).digest('hex').slice(0, 7);
    for (const old of fs.readdirSync(OUT)) if (old.startsWith(`${key}-`)) fs.rmSync(path.join(OUT, old));
    fs.writeFileSync(path.join(OUT, `${key}-${hash}.jpg`), photo);
    manifest.images[key] = { src: `/media/products/${key}-${hash}.jpg`, ...(await meta(photo)), focal: name === 'modelo' ? focal : { x: 0.5, y: 0.5 } };
  }
  // Las fotos anteriores de este producto (ya sin uso) se retiran.
  for (const old of [`${id}.jpg`, `${id}-detail.jpg`]) fs.rmSync(path.join(OUT, old), { force: true });
  delete manifest.images[id];
  delete manifest.images[`${id}-detail`];

  // Giro 360° (scripts/lib/spin.mjs): todos los fotogramas del vídeo, o 24 repartidos por igual si trae más.
  const { count, source, ...spin } = await buildSpin({ id, video: file(slug, '360-par', 'mp4'), root, ffmpeg: FFMPEG });
  manifest.spin[id] = spin;
  console.log(`✔ ${id} (${slug}): ${kinds.length} fotos + ${count} fotogramas (de ${source}) ${spin.width}×${spin.height}`);
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
