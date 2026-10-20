/** Utilidades de las fotos de producto: 4:5 sin deformar, sin recorte y metadatos (blur, tono). */
import sharp from 'sharp';

const RATIO = 4 / 5;
const MAX_SIDE = 1600;

/** Lleva la foto a 4:5 ampliando el fondo con un degradado vertical (el borde real tiene viñeta, así que se funde con un tramo largo). */
export async function pad45(f) {
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
export async function plain(f) {
  return sharp(f).rotate().resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true, kernel: 'lanczos3' }).toBuffer();
}

export async function meta(buffer) {
  const { width, height } = await sharp(buffer).metadata();
  const blur = await sharp(buffer).resize(14, undefined, { fit: 'inside' }).jpeg({ quality: 42 }).toBuffer();
  const stats = await sharp(buffer).resize(24, 24).stats();
  const [r, g, b] = stats.channels.map((c) => Math.round(c.mean));
  return { width, height, blur: `data:image/jpeg;base64,${blur.toString('base64')}`, tone: `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}` };
}

