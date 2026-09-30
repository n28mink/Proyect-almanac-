#!/usr/bin/env node
/**
 * Renderiza clips de campaña a partir de las fotos propias (movimiento suave, fundidos, destello y viñeta).
 *   FFMPEG=/ruta/ffmpeg node scripts/render-clips.mjs [claveClip ...]
 *
 * NO es metraje de rodaje: es "motion-grading" de fotografía existente. Para usar vídeo real, sustituir los archivos
 * (o las rutas en src/content/media.ts) sin tocar ningún componente.
 * Salida: public/media/video/<clave>.<variante>.{mp4,webm,jpg} y metadatos en media.generated.json → videos.
 */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { chromium } from '@playwright/test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(root, 'public/media/video');
const MANIFEST = path.join(root, 'src/content/media.generated.json');
const FFMPEG = process.env.FFMPEG ?? 'ffmpeg';
const FPS = 24;
fs.mkdirSync(OUT, { recursive: true });

const D = { desktop: [1280, 720], mobile: [720, 1280], portrait: [720, 900], hover: [720, 900] };

/** shot: [imagen, inicio, duración, zoom0, zoom1, focoX0, focoY0, focoX1, focoY1] (foco en fracciones 0–1 de la imagen). */
const CLIPS = {
  'hero.campaign': { dur: 12.4, variants: ['desktop', 'mobile'], shots: [
    ['rw03-2', 0, 4.6, 1.0, 1.16, 0.5, 0.5, 0.46, 0.5], ['an07', 3.6, 4.4, 1.14, 1.0, 0.6, 0.5, 0.55, 0.52],
    ['pu08', 7.0, 4.0, 1.0, 1.14, 0.45, 0.5, 0.5, 0.5], ['an04', 9.6, 3.4, 1.02, 1.16, 0.52, 0.5, 0.5, 0.48], ['rw03-2', 11.9, 0.9, 1.0, 1.01, 0.5, 0.5, 0.5, 0.5, 'loop'],
  ], sheen: [[1.2, 3.0], [8.0, 3.0]] },
  'campaign.jewelry': { dur: 8.6, variants: ['desktop', 'mobile'], shots: [
    ['an07', 0, 3.2, 1.0, 1.16, 0.6, 0.45, 0.55, 0.5], ['an06', 2.4, 3.2, 1.14, 1.0, 0.5, 0.5, 0.5, 0.5],
    ['an12', 5.0, 3.0, 1.0, 1.14, 0.5, 0.55, 0.48, 0.5], ['an07', 7.8, 0.8, 1.0, 1.01, 0.6, 0.45, 0.6, 0.45, 'loop'],
  ], sheen: [[1.0, 2.6], [5.4, 2.6]] },
  'campaign.watches': { dur: 8.6, variants: ['desktop', 'mobile'], shots: [
    ['rw03-2', 0, 3.2, 1.0, 1.16, 0.5, 0.5, 0.45, 0.5], ['rw03-4', 2.4, 3.2, 1.14, 1.0, 0.45, 0.5, 0.5, 0.5],
    ['rw02', 5.0, 3.0, 1.0, 1.14, 0.5, 0.5, 0.46, 0.5], ['rw03-2', 7.8, 0.8, 1.0, 1.01, 0.5, 0.5, 0.5, 0.5, 'loop'],
  ], sheen: [[0.8, 2.8], [5.2, 2.6]] },
  'editorial.fashion': { dur: 8.6, variants: ['desktop', 'mobile'], shots: [
    ['ar10', 0, 3.2, 1.0, 1.14, 0.6, 0.5, 0.55, 0.5], ['co09', 2.4, 3.2, 1.14, 1.0, 0.5, 0.45, 0.5, 0.5],
    ['ar11', 5.0, 3.0, 1.0, 1.12, 0.5, 0.5, 0.5, 0.5], ['ar10', 7.8, 0.8, 1.0, 1.01, 0.6, 0.5, 0.6, 0.5, 'loop'],
  ], sheen: [] },
  'story.craft': { dur: 8.6, variants: ['desktop', 'mobile'], shots: [
    ['an10-detail', 0, 3.2, 1.0, 1.16, 0.4, 0.5, 0.6, 0.5], ['an11-detail', 2.4, 3.2, 1.14, 1.0, 0.6, 0.5, 0.4, 0.5],
    ['pu07-detail', 5.0, 3.0, 1.0, 1.14, 0.5, 0.5, 0.5, 0.5], ['an10-detail', 7.8, 0.8, 1.0, 1.01, 0.4, 0.5, 0.4, 0.5, 'loop'],
  ], sheen: [[0.6, 2.6], [5.2, 2.6]] },
  'reel.watches': { dur: 6.2, variants: ['portrait'], shots: [['rw01', 0, 2.6, 1.05, 1.2, 0.5, 0.5, 0.5, 0.5], ['rw05-2', 1.9, 2.6, 1.18, 1.02, 0.5, 0.5, 0.5, 0.5], ['rw02-2', 4.2, 1.6, 1.02, 1.1, 0.5, 0.5, 0.5, 0.5], ['rw01', 5.8, 0.4, 1.05, 1.06, 0.5, 0.5, 0.5, 0.5, 'loop']], sheen: [[0.8, 2]] },
  'reel.rings': { dur: 6.2, variants: ['portrait'], shots: [['an02', 0, 2.6, 1.05, 1.2, 0.5, 0.5, 0.5, 0.5], ['an05', 1.9, 2.6, 1.18, 1.02, 0.5, 0.5, 0.5, 0.5], ['an12', 4.2, 1.6, 1.02, 1.1, 0.5, 0.5, 0.5, 0.5], ['an02', 5.8, 0.4, 1.05, 1.06, 0.5, 0.5, 0.5, 0.5, 'loop']], sheen: [[0.8, 2]] },
  'reel.necklaces': { dur: 6.2, variants: ['portrait'], shots: [['co01', 0, 2.6, 1.05, 1.2, 0.5, 0.5, 0.5, 0.5], ['co05', 1.9, 2.6, 1.18, 1.02, 0.5, 0.5, 0.5, 0.5], ['co16', 4.2, 1.6, 1.02, 1.1, 0.5, 0.5, 0.5, 0.5], ['co01', 5.8, 0.4, 1.05, 1.06, 0.5, 0.5, 0.5, 0.5, 'loop']], sheen: [[0.8, 2]] },
  'reel.earrings': { dur: 6.2, variants: ['portrait'], shots: [['ar03', 0, 2.6, 1.05, 1.2, 0.5, 0.5, 0.5, 0.5], ['ar12', 1.9, 2.6, 1.18, 1.02, 0.5, 0.5, 0.5, 0.5], ['ar28', 4.2, 1.6, 1.02, 1.1, 0.5, 0.5, 0.5, 0.5], ['ar03', 5.8, 0.4, 1.05, 1.06, 0.5, 0.5, 0.5, 0.5, 'loop']], sheen: [[0.8, 2]] },
  'reel.bracelets': { dur: 6.2, variants: ['portrait'], shots: [['pu04', 0, 2.6, 1.05, 1.2, 0.5, 0.5, 0.5, 0.5], ['pu07', 1.9, 2.6, 1.18, 1.02, 0.5, 0.5, 0.5, 0.5], ['pu10', 4.2, 1.6, 1.02, 1.1, 0.5, 0.5, 0.5, 0.5], ['pu04', 5.8, 0.4, 1.05, 1.06, 0.5, 0.5, 0.5, 0.5, 'loop']], sheen: [[0.8, 2]] },
  ...Object.fromEntries(['rw04', 'an04', 'co11', 'pu06', 'ar06', 'rw03'].map((id) => [`product.${id}`, {
    dur: 3.2, variants: ['hover'], shots: [[id, 0, 3.2, 1.0, 1.16, 0.5, 0.5, 0.5, 0.5]], sheen: [[0.4, 2.2]],
  }])),
};

const ease = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const clamp01 = (x) => Math.max(0, Math.min(1, x));

function serve() {
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split('?')[0]);
    if (url === '/') {
      res.setHeader('content-type', 'text/html');
      res.end('<!doctype html><html><body style="margin:0"><canvas id="c"></canvas></body></html>');
      return;
    }
    const file = path.join(root, 'public', url);
    if (!file.startsWith(path.join(root, 'public')) || !fs.existsSync(file)) { res.statusCode = 404; res.end(); return; }
    res.setHeader('content-type', 'image/jpeg');
    res.end(fs.readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

function encoder(w, h, base) {
  const args = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', w >= 1000 ? '26' : '27', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart', `${base}.mp4`,
    '-an', '-c:v', 'libvpx-vp9', '-crf', '38', '-b:v', '0', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '2', '-pix_fmt', 'yuv420p', `${base}.webm`];
  const proc = spawn(FFMPEG, args, { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((resolve, reject) => proc.on('close', (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg salió con ${c}`)))));
  return { stdin: proc.stdin, done };
}

const only = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
manifest.videos ??= {};
const imgMeta = manifest.images;

const server = await serve();
const port = server.address().port;
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium' });

for (const [key, clip] of Object.entries(CLIPS)) {
  if (only.length && !only.includes(key)) continue;
  manifest.videos[key] = { duration: clip.dur, sources: {}, posters: {} };
  for (const variant of clip.variants) {
    const [W, H] = D[variant];
    const base = path.join(OUT, `${key}.${variant}`);
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    await page.goto(`http://127.0.0.1:${port}/`);
    const names = [...new Set(clip.shots.map((s) => s[0]))];
    await page.evaluate(async ({ names, W, H }) => {
      window.__imgs = {};
      await Promise.all(names.map((n) => new Promise((ok, ko) => {
        const im = new Image();
        im.onload = () => { window.__imgs[n] = im; ok(); };
        im.onerror = () => ko(new Error('no carga ' + n));
        im.src = `/media/products/${n}.jpg`;
      })));
      const c = document.getElementById('c');
      c.width = W; c.height = H;
      window.__ctx = c.getContext('2d');
      window.__ctx.imageSmoothingQuality = 'high';
    }, { names, W, H });

    const enc = encoder(W, H, base);
    const total = Math.round(clip.dur * FPS);
    let firstFrame;
    for (let f = 0; f < total; f++) {
      const t = f / FPS;
      const layers = clip.shots.map(([name, at, dur, z0, z1, x0, y0, x1, y1, loop]) => {
        const u = clamp01((t - at) / dur);
        const fade = loop ? clamp01((t - at) / Math.min(0.9, dur)) : clamp01((t - at) / 1.0);
        const visible = t >= at && t <= at + dur + (loop ? 1 : 0.02);
        return { name, u: ease(u), z: z0 + (z1 - z0) * ease(u), x: x0 + (x1 - x0) * ease(u), y: y0 + (y1 - y0) * ease(u), alpha: at === 0 ? 1 : ease(fade), visible: t >= at };
      });
      const sheen = clip.sheen.map(([s, d]) => clamp01((t - s) / d)).find((v) => v > 0 && v < 1) ?? -1;
      const dataUrl = await page.evaluate(({ layers, sheen, W, H }) => {
        const ctx = window.__ctx;
        ctx.globalCompositeOperation = 'source-over';
        ctx.filter = 'none';
        ctx.fillStyle = '#151412';
        ctx.fillRect(0, 0, W, H);
        ctx.filter = 'contrast(1.05) saturate(0.93) sepia(0.05)';
        for (const l of layers) {
          if (!l.visible) continue;
          const im = window.__imgs[l.name];
          const ar = W / H;
          let cw = Math.min(im.width, im.height * ar) / l.z;
          let ch = cw / ar;
          if (ch > im.height) { ch = im.height / l.z; cw = ch * ar; }
          const sx = Math.max(0, Math.min(im.width - cw, l.x * im.width - cw / 2));
          const sy = Math.max(0, Math.min(im.height - ch, l.y * im.height - ch / 2));
          ctx.globalAlpha = l.alpha;
          ctx.drawImage(im, sx, sy, cw, ch, 0, 0, W, H);
        }
        ctx.globalAlpha = 1;
        ctx.filter = 'none';
        if (sheen >= 0) {
          const p = sheen;
          const cx = -0.3 * W + p * 1.6 * W;
          const g = ctx.createLinearGradient(cx - 0.22 * W, 0, cx + 0.22 * W, H * 0.4);
          g.addColorStop(0, 'rgba(255,248,235,0)');
          g.addColorStop(0.5, 'rgba(255,248,235,0.20)');
          g.addColorStop(1, 'rgba(255,248,235,0)');
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, W, H);
        }
        ctx.globalCompositeOperation = 'multiply';
        const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.78);
        v.addColorStop(0, 'rgba(255,255,255,1)');
        v.addColorStop(1, 'rgba(70,58,46,1)');
        ctx.fillStyle = v;
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
        return ctx.canvas.toDataURL('image/jpeg', 0.92);
      }, { layers, sheen, W, H });
      const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
      if (f === 0) firstFrame = buf;
      if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once('drain', r));
    }
    enc.stdin.end();
    await enc.done;
    await page.close();

    const posterBuf = await sharp(firstFrame).jpeg({ quality: 74, mozjpeg: true, progressive: true }).toBuffer();
    fs.writeFileSync(`${base}.jpg`, posterBuf);
    const blur = await sharp(firstFrame).resize(14, undefined, { fit: 'inside' }).jpeg({ quality: 42 }).toBuffer();
    const st = await sharp(firstFrame).resize(24, 24).stats();
    const tone = '#' + st.channels.slice(0, 3).map((c) => Math.round(c.mean).toString(16).padStart(2, '0')).join('');
    const rel = `/media/video/${key}.${variant}`;
    manifest.videos[key].sources[variant] = [
      { src: `${rel}.webm`, type: 'video/webm; codecs="vp9"', width: W, height: H },
      { src: `${rel}.mp4`, type: 'video/mp4', width: W, height: H },
    ];
    manifest.videos[key].posters[variant] = { src: `${rel}.jpg`, width: W, height: H, blur: `data:image/jpeg;base64,${blur.toString('base64')}`, tone };
    const kb = (f) => Math.round(fs.statSync(`${base}.${f}`).size / 1024);
    console.log(`✔ ${key} [${variant}] ${W}×${H} · mp4 ${kb('mp4')} KB · webm ${kb('webm')} KB`);
    fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  }
}

await browser.close();
server.close();
console.log('✔ clips listos');
