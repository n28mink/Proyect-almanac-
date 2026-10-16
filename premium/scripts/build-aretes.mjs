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
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, '../fotos/aretes-originales');
const OUT = path.join(root, 'public/media/products');
const MANIFEST = path.join(root, 'src/content/media.generated.json');
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const RATIO = 4 / 5;
const MAX_SIDE = 1600;
const MAX_FRAMES = 24;
const FRAME_SIDE = 1080;

/** Producto del catálogo → diseño de la carpeta de originales, y dónde está el arete en la foto con modelo (0–1). */
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
};

const file = (slug, kind, ext = 'png') => path.join(SRC, `arete-${slug}-${kind}.${ext}`);

/** Lleva la foto a 4:5 ampliando el fondo con un degradado vertical (el borde real tiene viñeta, así que se funde con un tramo largo). */
async function pad45(f) {
  const img = sharp(f).rotate();
  const { width: w0, height: h0 } = await img.metadata();
  const w = Math.min(w0, MAX_SIDE);
  const buf = await img.resize(w, null, { kernel: 'lanczos3' }).toBuffer();
  const h = (await sharp(buf).metadata()).height;
  const H = Math.round(w / RATIO);
  if (H - h < 0.03 * H) return buf; // ya es casi 4:5
  if (H < h) return buf; // más estrecha que 4:5: el recorte lateral lo hace object-cover
  const extra = H - h;
  const top = Math.floor(extra / 2);
  const edge = async (upper) => {
    const strip = await sharp(buf).extract({ left: 0, top: Math.round(h * (upper ? 0.2 : 0.8)), width: Math.min(120, w), height: 12 }).removeAlpha().raw().toBuffer();
    const st = await sharp(strip, { raw: { width: Math.min(120, w), height: 12, channels: 3 } }).stats();
    return `rgb(${st.channels.slice(0, 3).map((c) => Math.round(c.mean)).join(',')})`;
  };
  const backdrop = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="${top / H}" stop-color="${await edge(true)}"/><stop offset="${(top + h) / H}" stop-color="${await edge(false)}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#b)"/></svg>`)).png().toBuffer();
  const feather = Math.round(h * 0.18);
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="${feather / h}" stop-color="#fff"/><stop offset="${1 - feather / h}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const fg = await sharp(buf).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
  return sharp(backdrop).composite([{ input: fg, top, left: 0 }]).toBuffer();
}

/** Sin recorte: solo se reduce si pasa de MAX_SIDE por el lado largo. */
async function plain(f) {
  return sharp(f).rotate().resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' }).toBuffer();
}

async function meta(buffer) {
  const { width, height } = await sharp(buffer).metadata();
  const blur = await sharp(buffer).resize(14, undefined, { fit: 'inside' }).jpeg({ quality: 42 }).toBuffer();
  const stats = await sharp(buffer).resize(24, 24).stats();
  const [r, g, b] = stats.channels.map((c) => Math.round(c.mean));
  return { width, height, blur: `data:image/jpeg;base64,${blur.toString('base64')}`, tone: `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}` };
}

const hex = (rgbStats) => `#${rgbStats.channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, '0')).join('')}`;

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

  // Giro 360°: todos los fotogramas del vídeo.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spin-'));
  execFileSync(FFMPEG, ['-v', 'error', '-i', file(slug, '360-par', 'mp4'), '-vsync', '0', path.join(tmp, 'f%02d.png')]);
  const all = fs.readdirSync(tmp).filter((f) => f.endsWith('.png')).sort();
  // Vídeos con muchos fotogramas (30 fps): se reparten 24 por igual; los de 12 se usan enteros.
  const frames = all.length > MAX_FRAMES ? Array.from({ length: MAX_FRAMES }, (_, i) => all[Math.floor((i * all.length) / MAX_FRAMES)]) : all;
  const tag = crypto.createHash('sha1');
  const bufs = [];
  for (const f of frames) {
    const b = await sharp(path.join(tmp, f)).resize(FRAME_SIDE, FRAME_SIDE, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 84, effort: 5 }).toBuffer();
    tag.update(b);
    bufs.push(b);
  }
  const hash = tag.digest('hex').slice(0, 7);
  const dir = path.join(root, 'public/media/spin', id);
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  bufs.forEach((b, i) => fs.writeFileSync(path.join(dir, `f${String(i + 1).padStart(2, '0')}-${hash}.webp`), b));
  const first = await sharp(bufs[0]).metadata();
  // Color de las bandas de la caja 4:5: el del borde del fotograma (esquina), no la media de toda la imagen.
  const corner = await sharp(path.join(tmp, frames[0])).extract({ left: 0, top: 0, width: 24, height: 24 }).removeAlpha().raw().toBuffer();
  const tone = hex(await sharp(corner, { raw: { width: 24, height: 24, channels: 3 } }).stats());
  fs.rmSync(tmp, { recursive: true, force: true });
  manifest.spin[id] = { frames: bufs.map((_, i) => `/media/spin/${id}/f${String(i + 1).padStart(2, '0')}-${hash}.webp`), width: first.width, height: first.height, tone };
  console.log(`✔ ${id} (${slug}): ${kinds.length} fotos + ${frames.length} fotogramas ${first.width}×${first.height}`);
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
