#!/usr/bin/env node
/**
 * Convierte el catálogo original de Clover (scripts/data/clover-source.json) + traducciones al inglés
 * (scripts/data/en.*.json) + metadatos de imagen (media.generated.json) en src/content/catalog.generated.json.
 *   npm run media && npm run seed
 * Principio: no se afirma ningún material o característica que la ficha original no declare.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURATED_IDS, EXCLUDED_REASON, LIFESTYLE } from './lib/curation.mjs';

const REELS = new Set(['watches', 'rings', 'necklaces', 'earrings', 'bracelets']);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/clover-source.json'), 'utf8'));
const media = JSON.parse(fs.readFileSync(path.join(root, 'src/content/media.generated.json'), 'utf8'));
const en = {};
for (const f of fs.readdirSync(path.join(root, 'scripts/data')).filter((n) => n.startsWith('en.'))) {
  Object.assign(en, JSON.parse(fs.readFileSync(path.join(root, 'scripts/data', f), 'utf8')));
}

const L = (es, enText) => ({ es, en: enText });

const CATEGORY = { rw: 'watches', st: 'accessories', an: 'rings', pu: 'bracelets', co: 'necklaces', ar: 'earrings' };

const COLOR_EN = {
  'Oro rosa': 'Rose gold', Blanco: 'White', Negro: 'Black', Dorado: 'Gold tone', Verde: 'Green', Azul: 'Blue', Gris: 'Slate gray',
  Plateado: 'Silver tone', Turquesa: 'Turquoise',
};
const COLOR_ES = { Dorado: 'Tono dorado', Plateado: 'Tono plateado' };

const ONE_SIZE = L('Talla única', 'One size');

const VARIANTS = {
  rw02: [[L('Esfera negra', 'Black dial'), 0], [L('Esfera blanca', 'White dial'), 1]],
  rw03: [[L('Esfera blanca', 'White dial'), 0], [L('Esfera verde', 'Green dial'), 1], [L('Esfera azul', 'Blue dial'), 2], [L('Esfera gris pizarra', 'Slate gray dial'), 3], [L('Esfera negra', 'Black dial'), 4]],
  rw05: [[L('Plateado · esfera negra', 'Silver · black dial'), 0], [L('Dorado · esfera plateada', 'Gold · silver dial'), 1]],
  st01: [[L('Esfera blanca', 'White dial'), 0], [L('Esfera verde', 'Green dial'), 1]],
  pu02: [[L('Tono dorado', 'Gold tone'), 0], [L('Tono plateado', 'Silver tone'), 0]],
  pu13: [[L('Tono plateado', 'Silver tone'), 0], [L('Tono dorado', 'Gold tone'), 0]],
};

const COLLECTION = {
  tiempo: ['rw01', 'rw02', 'rw03', 'rw04', 'rw05', 'rw06', 'st01'],
  corazon: ['ar04', 'co02', 'co06', 'co12', 'co19', 'pu04', 'pu06', 'pu11'],
  lumiere: ['an03', 'an07', 'an09', 'ar11', 'ar15', 'ar37', 'ar39', 'co08', 'co09', 'co10', 'co11', 'pu10', 'pu12', 'pu13'],
  jardin: ['an01', 'an06', 'an12', 'ar05', 'ar29', 'ar30', 'ar32', 'ar34', 'co03', 'co05', 'co13', 'co15', 'co17', 'co18', 'pu08'],
  aurea: ['an02', 'an04', 'an05', 'an10', 'an11', 'ar03', 'ar06', 'ar07', 'ar08', 'ar09', 'ar10', 'ar12', 'ar14', 'ar27', 'ar28', 'ar36', 'ar45', 'pu01', 'pu02', 'pu03', 'pu05', 'pu07', 'pu09'],
};
const collectionOf = (id) => Object.entries(COLLECTION).find(([, ids]) => ids.includes(id))?.[0];

const FEATURED = ['rw04', 'an04', 'co11', 'pu06', 'ar06', 'rw03', 'an07', 'pu01'];
const NEW_ARRIVAL = ['an12', 'pu08', 'co10', 'ar37', 'an09', 'pu09', 'rw05', 'co15', 'ar30', 'an05', 'pu10', 'co17'];
const BESTSELLER = ['rw01', 'co11', 'ar04', 'pu06', 'an02', 'co09', 'ar11', 'pu04', 'co19', 'ar07', 'rw04', 'st01'];
const GIFT_TAGS = new Set(['heart', 'pearl', 'set', 'moon', 'butterfly', 'star', 'clover']);
const HOVER_VIDEO = new Set(['rw04', 'an04', 'co11', 'pu06', 'ar06', 'rw03']);

const WATCH_3D = {
  rw01: { caseShape: 'round', strap: 'mesh', finish: 'rose-gold', dials: ['#f4f1ea'] },
  rw02: { caseShape: 'square', strap: 'link', finish: 'rose-gold', dials: ['#1b1b1d', '#f4f1ea'] },
  rw03: { caseShape: 'rect', strap: 'link', finish: 'yellow-gold', dials: ['#f4f1ea', '#1f6a4d', '#1b2f6b', '#5b6670', '#141414'] },
  rw04: { caseShape: 'round', strap: 'link', finish: 'yellow-gold', dials: ['#f4f1ea'] },
  rw05: { caseShape: 'square', strap: 'link', finish: 'silver', dials: ['#141414', '#d9d9d6'] },
};

const TAG_RULES = [
  ['pearl', /perla|pearl/i], ['heart', /coraz|heart/i], ['butterfly', /mariposa|butterfly/i], ['flower', /flor|flower|margarita/i],
  ['moon', /luna|moon/i], ['star', /estrella|star/i], ['knot', /nudo|knot/i], ['hoop', /argolla|hoop/i], ['stud', /bot[oó]n|stud/i],
  ['leaf', /hoja|leaf/i], ['clover', /tr[eé]bol|clover/i], ['shell', /concha|shell/i], ['set', /set/i], ['statement', /gruesa|ancha|gran|thick|wide|large/i],
  ['crystal', /cristal|crystal/i], ['gemstone', /piedra|stone/i],
];

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const cents = (n) => Math.round(n * 100);

function finishOf(colors, id) {
  if (colors.includes('Oro rosa')) return 'rose';
  if (colors.includes('Dorado') && colors.includes('Plateado')) return 'mixed';
  if (colors.includes('Dorado')) return 'gold';
  if (id === 'rw06' || colors.includes('Plateado')) return 'silver';
  return 'mixed';
}
const FINISH_LABEL = {
  gold: L('Tono dorado', 'Gold tone'), silver: L('Tono plateado', 'Silver tone'), rose: L('Tono oro rosa', 'Rose-gold tone'), mixed: L('Dos tonos', 'Two-tone'),
};

function buildSpecs(p, t, finish, highlightsEs) {
  const specs = [];
  const steel = p.detalles.find((d) => /acero/i.test(d));
  if (steel) {
    const is304 = /304/.test(steel);
    specs.push({
      label: L('Material', 'Material'),
      value: is304 ? L('Acero inoxidable 304 (según el proveedor)', '304 stainless steel (as stated by the supplier)')
        : /etiqueta/i.test(steel) ? L('Acero (según etiqueta visible)', 'Steel (as stated on the visible label)')
        : L('Acero inoxidable (según el empaque)', 'Stainless steel (as stated on the packaging)'),
    });
  } else {
    specs.push({ label: L('Material', 'Material'), value: L('Metal con acabado ' + FINISH_LABEL[finish].es.toLowerCase(), 'Metal with a ' + FINISH_LABEL[finish].en.toLowerCase() + ' finish') });
  }
  specs.push({ label: L('Acabado', 'Finish'), value: FINISH_LABEL[finish] });
  const hay = (re) => p.detalles.some((d) => re.test(d));
  if (hay(/mosquet/i)) specs.push({ label: L('Cierre', 'Clasp'), value: L('Mosquetón con cadena extensora', 'Lobster clasp with extender chain') });
  else if (hay(/cierre ajustable/i)) specs.push({ label: L('Cierre', 'Clasp'), value: L('Ajustable', 'Adjustable') });
  if (hay(/abierto ajustable|ajustable al abrirse|malla ajustable/i)) specs.push({ label: L('Ajuste', 'Fit'), value: L('Ajustable', 'Adjustable') });
  else specs.push({ label: L('Talla', 'Size'), value: ONE_SIZE });
  if (hay(/par incluido/i)) specs.push({ label: L('Incluye', 'Includes'), value: L('Un par', 'One pair') });
  if (p.id === 'st01') specs.push({ label: L('Incluye', 'Includes'), value: L('Reloj, pulsera, collar con dije, anillo y aretes (estuche no incluido)', 'Watch, bracelet, pendant necklace, ring and earrings (display box not included)') });
  specs.push({ label: L('Cuidado', 'Care'), value: L('Limpiar con paño suave y seco; guardar por separado.', 'Wipe with a soft, dry cloth; store separately.') });
  return specs;
}

const catalog = [];
const slugs = new Set();
const excluded = [];

for (const p of source) {
  if (!CURATED_IDS.includes(p.id)) {
    excluded.push({ id: p.id, name: p.nombre, reason: p.id.startsWith('ar') ? EXCLUDED_REASON.packaging : EXCLUDED_REASON.layout });
    continue;
  }
  const t = en[p.id];
  if (!t) throw new Error(`Falta traducción para ${p.id}`);
  const prefix = p.id.slice(0, 2);
  const category = CATEGORY[prefix];
  const finish = finishOf(p.colores, p.id);

  let slug = slugify(t.name);
  if (slugs.has(slug)) slug += `-${p.id}`;
  slugs.add(slug);

  // ES: original menos notas de foto, o override explícito.
  const esHighlights = t.es?.highlights ?? p.detalles.filter((_, i) => !(t.esDrop ?? []).includes(i));
  if (esHighlights.length !== t.highlights.length) throw new Error(`Highlights desalineados en ${p.id}`);
  const highlights = esHighlights.map((es, i) => L(es, t.highlights[i]));

  // Imágenes: originales + detalle macro al final.
  const names = p.imagenes.map((r) => path.basename(r, path.extname(r)));
  const images = names.map((n, i) => {
    const m = media.images[n];
    if (!m) throw new Error(`Sin metadatos de imagen: ${n}`);
    const worn = LIFESTYLE.has(p.id) && i === 0;
    return {
      src: m.src, width: m.width, height: m.height, blur: m.blur, tone: m.tone, focal: m.focal, role: worn ? 'lifestyle' : 'main',
      alt: L(worn ? `${p.nombre}, usada` : p.nombre, worn ? `${t.name}, worn` : t.name),
    };
  });
  const dm = media.images[`${p.id}-detail`];
  images.push({
    src: dm.src, width: dm.width, height: dm.height, blur: dm.blur, tone: dm.tone, focal: dm.focal, role: 'detail',
    alt: L(`Detalle de ${p.nombre}`, `Close-up detail of ${t.name}`),
  });
  const detailIndex = images.length - 1;

  // Variantes.
  const vdefs = VARIANTS[p.id];
  const variants = (vdefs ?? [[FINISH_LABEL[finish], 0]]).map(([color, imageIndex], i) => ({
    id: `${p.id}-${i + 1}`,
    sku: `CLV-${p.id.toUpperCase()}-${i + 1}`,
    options: { color, size: ONE_SIZE },
    imageIndex,
    stock: p.stock,
  }));

  const text = `${p.nombre} ${p.descripcion} ${p.detalles.join(' ')}`;
  const tags = TAG_RULES.filter(([, re]) => re.test(text)).map(([k]) => k);
  const isGift = tags.some((x) => GIFT_TAGS.has(x));
  const audience = p.id === 'rw06' ? ['men'] : p.id === 'rw05' ? ['women', 'men'] : ['women'];
  const isNew = NEW_ARRIVAL.includes(p.id);
  const categories = [category, ...(category !== 'watches' && p.id !== 'st01' ? ['jewelry'] : []), ...(p.id === 'st01' ? ['jewelry', 'watches'] : []), ...audience, ...(isGift || p.id === 'st01' ? ['gifts'] : []), ...(isNew ? ['new-arrivals'] : [])];

  const model = WATCH_3D[p.id];
  const hasVideo = HOVER_VIDEO.has(p.id);

  catalog.push({
    id: p.id,
    slug,
    name: L(p.nombre, t.name),
    description: L(p.descripcion, t.description),
    story: L(p.descripcionLarga, t.story),
    category,
    categories,
    collection: collectionOf(p.id),
    audience,
    tags: [...tags, ...(isGift ? ['gift'] : [])],
    price: cents(p.precio),
    currency: 'USD',
    material: buildSpecs(p, t, finish, esHighlights)[0].value,
    color: p.colores.map((c) => L(COLOR_ES[c] ?? c, COLOR_EN[c] ?? c)),
    finish,
    sizes: [ONE_SIZE],
    variants,
    images,
    videos: [...(hasVideo ? [`product.${p.id}`] : []), ...(REELS.has(category) ? [`reel.${category}`] : [])],
    thumbnail: images[0].src,
    hoverMedia: hasVideo ? { type: 'video', key: `product.${p.id}` } : { type: 'image', imageIndex: detailIndex },
    highlights,
    specifications: buildSpecs(p, t, finish, esHighlights),
    stock: variants.reduce((s, v) => s + v.stock, 0),
    featured: FEATURED.includes(p.id),
    newArrival: isNew,
    bestseller: BESTSELLER.includes(p.id),
    ...(model ? {
      model3d: {
        kind: 'watch', caseShape: model.caseShape, strap: model.strap, finishes: ['yellow-gold', 'rose-gold', 'silver'], defaultFinish: model.finish,
        dials: variants.map((v, i) => ({ variantId: v.id, color: model.dials[i] ?? model.dials[0] })),
      },
    } : {}),
    seo: {
      title: L(`${p.nombre} | Clover`, `${t.name} | Clover`),
      description: L(p.descripcion, t.description),
    },
  });
}

fs.writeFileSync(path.join(root, 'src/content/catalog.generated.json'), JSON.stringify(catalog, null, 1) + '\n');
fs.writeFileSync(path.join(root, 'docs/seed-excluded.json'), JSON.stringify(excluded, null, 2) + '\n');
console.log(`✔ ${catalog.length} productos · ${excluded.length} excluidos (ver docs/seed-excluded.json)`);
