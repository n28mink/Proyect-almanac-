/**
 * Giro 360° de un producto a partir de un vídeo de la pieza girando (turntable).
 * Descompone el vídeo en fotogramas webp (a 1080 px como máximo), escribe public/media/spin/<id>/fNN-<hash>.webp
 * y devuelve la entrada del manifiesto: { frames, width, height, tone }.
 * Con más de MAX_FRAMES fotogramas (vídeos a 30 fps) se reparten MAX_FRAMES por igual; los de 12–24 se usan enteros.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const MAX_FRAMES = Number(process.env.SPIN_MAX_FRAMES ?? 24);
const FRAME_SIDE = 1080;


export async function buildSpin({ id, video, root, ffmpeg = process.env.FFMPEG ?? 'ffmpeg', skip = 0 }) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spin-'));
  try {
    execFileSync(ffmpeg, ['-v', 'error', '-i', video, '-vsync', '0', path.join(tmp, 'f%03d.png')]);
    const all = fs.readdirSync(tmp).filter((f) => f.endsWith('.png')).sort().slice(skip);
    if (all.length < 4) throw new Error(`El vídeo de ${id} tiene solo ${all.length} fotogramas; hacen falta al menos 4.`);
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
    const name = (i) => `f${String(i + 1).padStart(2, '0')}-${hash}.webp`;
    bufs.forEach((b, i) => fs.writeFileSync(path.join(dir, name(i)), b));
    const first = await sharp(bufs[0]).metadata();
    // Color de las bandas de la caja 4:5: el fondo real del fotograma (arriba y abajo en el centro, donde no hay pieza), no una esquina con viñeta.
    const probe = async (top) => {
      const raw = await sharp(bufs[0]).extract({ left: Math.floor(first.width / 2) - 12, top, width: 24, height: 24 }).removeAlpha().raw().toBuffer();
      return (await sharp(raw, { raw: { width: 24, height: 24, channels: 3 } }).stats()).channels.slice(0, 3).map((c) => c.mean);
    };
    const [up, down] = [await probe(2), await probe(first.height - 26)];
    const tone = `#${up.map((v, i) => Math.round((v + down[i]) / 2).toString(16).padStart(2, '0')).join('')}`;
    return { frames: bufs.map((_, i) => `/media/spin/${id}/${name(i)}`), width: first.width, height: first.height, tone, count: bufs.length, source: all.length };
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
