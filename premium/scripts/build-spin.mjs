#!/usr/bin/env node
/**
 * Añade el giro 360° a un producto que no sea de aretes (las pulseras, por ejemplo) desde un vídeo de la pieza girando.
 *   FFMPEG=/ruta/ffmpeg node scripts/build-spin.mjs <id> <vídeo.mp4>
 *   p. ej.: node scripts/build-spin.mjs pu08 ../fotos/pulseras-originales/pu08-360.mp4
 * Escribe public/media/spin/<id>/ y actualiza spin.<id> en src/content/media.generated.json. Después: npm run seed.
 * El vídeo debe dar una vuelta completa de la pieza sobre fondo uniforme (blanco), con la cámara fija: entre 12 y 36 fotogramas dan un giro fluido.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSpin } from './lib/spin.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(root, 'src/content/media.generated.json');
const [id, video] = process.argv.slice(2);
if (!id || !video || !fs.existsSync(video)) {
  console.error('Uso: node scripts/build-spin.mjs <id> <vídeo.mp4>');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
manifest.spin ??= {};
const { count, source, ...entry } = await buildSpin({ id, video, root });
manifest.spin[id] = entry;
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`✔ ${id}: ${count} fotogramas (de ${source} del vídeo) ${entry.width}×${entry.height}`);
