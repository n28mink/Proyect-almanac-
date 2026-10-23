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
import { unhedge } from './lib/hedges.mjs';

const REELS = new Set(['watches', 'rings', 'necklaces', 'earrings', 'bracelets']);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/clover-source.json'), 'utf8'));
// Ajustes y piezas nuevas sobre el catálogo original (scripts/data/source-extra.json).
const { _note: _extraNote, ...extras } = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/source-extra.json'), 'utf8'));
for (const [id, fields] of Object.entries(extras)) {
  const at = source.findIndex((x) => x.id === id);
  if (at >= 0) Object.assign(source[at], fields);
  else source.push({ id, ...fields });
}
const media = JSON.parse(fs.readFileSync(path.join(root, 'src/content/media.generated.json'), 'utf8'));
const en = {};
for (const f of fs.readdirSync(path.join(root, 'scripts/data')).filter((n) => n.startsWith('en.'))) {
  Object.assign(en, JSON.parse(fs.readFileSync(path.join(root, 'scripts/data', f), 'utf8')));
}

const L = (es, enText) => ({ es, en: enText });

// Medidas, peso y cuidados reales por producto (scripts/data/product-details.json). Vacío hasta que la tienda los confirme.
const { _note, ...details } = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/product-details.json'), 'utf8'));
const usedDetails = new Set();
const asL = (v) => (typeof v === 'string' ? L(v, v) : L(v.es, v.en));
function withDetails(id, specs) {
  const d = details[id];
  if (!d) return specs;
  usedDetails.add(id);
  const careAt = specs.findIndex((s) => s.label.es === 'Cuidado');
  const rows = [
    ...(d.size ? [{ label: L('Medidas', 'Measurements'), value: asL(d.size) }] : []),
    ...(d.weight ? [{ label: L('Peso', 'Weight'), value: asL(d.weight) }] : []),
  ];
  const out = [...specs];
  const care = d.care ? { label: L('Cuidado', 'Care'), value: asL(d.care) } : null;
  if (care && careAt >= 0) out[careAt] = care;
  const at = out.findIndex((s) => s.label.es === 'Cuidado');
  if (at >= 0) out.splice(at, 0, ...rows);
  else out.push(...rows, ...(care ? [care] : []));
  return out;
}

const CATEGORY = { rw: 'watches', st: 'accessories', an: 'rings', pu: 'bracelets', co: 'necklaces', ar: 'earrings' };
/** Piezas cuyo id no coincide con su categoría: pu01 es un anillo ancho. */
const CATEGORY_OF = { pu01: 'rings' };

const COLOR_EN = {
  'Oro rosa': 'Rose gold', Blanco: 'White', Negro: 'Black', Dorado: 'Gold tone', Verde: 'Green', Azul: 'Blue', Gris: 'Slate gray',
  Plateado: 'Silver tone', Turquesa: 'Turquoise', Crema: 'Cream',
};
const COLOR_ES = { Dorado: 'Tono dorado', Plateado: 'Tono plateado' };

const ONE_SIZE = L('Talla única', 'One size');

const VARIANTS = {
  // rw02: la foto nueva es la de esfera blanca (0); la de esfera negra es la foto anterior, al final de la galería (4).
  rw02: [[L('Esfera blanca', 'White dial'), 0], [L('Esfera negra', 'Black dial'), 4]],
  // rw03: 4 vistas nuevas de la esfera blanca (0) y de la azul (4, reloj20); verde, gris pizarra y negra conservan sus fotos anteriores (8–10).
  rw03: [[L('Esfera blanca', 'White dial'), 0], [L('Esfera azul', 'Blue dial'), 4], [L('Esfera verde', 'Green dial'), 8], [L('Esfera gris pizarra', 'Slate gray dial'), 9], [L('Esfera negra', 'Black dial'), 10]],
  rw05: [[L('Plateado · esfera negra', 'Silver · black dial'), 0], [L('Dorado · esfera plateada', 'Gold · silver dial'), 4]],
  // st01: 4 vistas nuevas del reloj con esfera blanca (0) y con esfera verde (4, reloj21); después, las fotos anteriores del set completo y del set con esfera verde.
  st01: [[L('Esfera blanca', 'White dial'), 0], [L('Esfera verde', 'Green dial'), 4]],
  pu02: [[L('Tono dorado', 'Gold tone'), 0], [L('Tono plateado', 'Silver tone'), 0]],
  pu13: [[L('Tono plateado', 'Silver tone'), 0], [L('Tono dorado', 'Gold tone'), 0]],
};

/** Piezas con foto en blanco, foto con modelo y giro 360° (scripts/build-aretes.mjs y build-set.mjs): se detectan por tener `spin` en el manifiesto. */

/** Fotos que van a continuación de las 4 vistas de un reloj: [clave, rol, texto ES, texto EN]. Fotos anteriores de otras variantes y la segunda variante de rw05. */
const WATCH_EXTRA = {
  rw02: [['rw02', 'main', 'esfera negra', 'black dial']],
  rw03: [['rw15-frontal', 'main', 'esfera azul', 'blue dial'], ['rw15-45', 'main', 'esfera azul, de lado', 'blue dial, angled view'], ['rw15-macro', 'detail', 'esfera azul, detalle', 'blue dial, close-up'], ['rw15-posterior', 'main', 'esfera azul, vista posterior', 'blue dial, back view'], ['rw03-2', 'main', 'esfera verde', 'green dial'], ['rw03-4', 'main', 'esfera gris pizarra', 'slate gray dial'], ['rw03-5', 'main', 'esfera negra', 'black dial']],
  rw05: [['rw05b-frontal', 'main', 'variante dorada', 'gold variant'], ['rw05b-45', 'main', 'variante dorada, de lado', 'gold variant, angled view'], ['rw05b-macro', 'detail', 'variante dorada, detalle', 'gold variant, close-up'], ['rw05b-posterior', 'main', 'variante dorada, vista posterior', 'gold variant, back view']],
  st01: [['rw16-frontal', 'main', 'esfera verde', 'green dial'], ['rw16-45', 'main', 'esfera verde, de lado', 'green dial, angled view'], ['rw16-macro', 'detail', 'esfera verde, detalle', 'green dial, close-up'], ['rw16-posterior', 'main', 'esfera verde, vista posterior', 'green dial, back view'], ['st01', 'lifestyle', 'set completo', 'full set'], ['st01-2', 'main', 'set con esfera verde', 'set with green dial']],
};

const AUTO_DETAIL = /^(rw|st)/;

const COLLECTION = {
  tiempo: ['rw01', 'rw02', 'rw03', 'rw04', 'rw05', 'rw06', 'rw07', 'rw10', 'rw11', 'rw12', 'rw13', 'rw14', 'st01'],
  corazon: ['ar04', 'ar49', 'co02', 'co06', 'co12', 'co19', 'pu04', 'pu06', 'pu11'],
  lumiere: ['an03', 'an07', 'an09', 'ar11', 'ar15', 'ar19', 'ar24', 'ar25', 'ar37', 'ar39', 'ar42', 'ar44', 'ar52', 'ar55', 'co08', 'co09', 'co10', 'co11', 'pu10', 'pu12', 'pu13'],
  jardin: ['an01', 'an06', 'an12', 'ar01', 'ar05', 'ar13', 'ar16', 'ar17', 'ar21', 'ar29', 'ar30', 'ar32', 'ar33', 'ar34', 'ar35', 'ar38', 'ar50', 'ar53', 'ar54', 'co03', 'co05', 'co13', 'co15', 'co17', 'co18', 'pu08'],
  aurea: ['an02', 'an04', 'an05', 'an10', 'an11', 'ar02', 'ar03', 'ar06', 'ar07', 'ar08', 'ar09', 'ar10', 'ar12', 'ar14', 'ar18', 'ar20', 'ar22', 'ar23', 'ar26', 'ar27', 'ar28', 'ar31', 'ar36', 'ar40', 'ar41', 'ar43', 'ar45', 'ar47', 'ar48', 'ar51', 'pu01', 'pu02', 'pu03', 'pu05', 'pu07', 'pu09'],
};
const collectionOf = (id) => Object.entries(COLLECTION).find(([, ids]) => ids.includes(id))?.[0];

const FEATURED = ['rw04', 'an04', 'co11', 'pu06', 'ar06', 'rw03', 'an07', 'pu01'];
const NEW_ARRIVAL = ['rw07', 'rw10', 'an12', 'pu08', 'co10', 'ar37', 'an09', 'pu09', 'rw05', 'co15', 'ar30', 'an05', 'pu10', 'co17'];
const BESTSELLER = ['rw01', 'co11', 'ar04', 'pu06', 'an02', 'co09', 'ar11', 'pu04', 'co19', 'ar07', 'rw04', 'st01'];
const GIFT_TAGS = new Set(['heart', 'pearl', 'set', 'moon', 'butterfly', 'star', 'clover']);
const HOVER_VIDEO = new Set();

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
      value: is304 ? L('Acero inoxidable 304', '304 stainless steel')
        : /inox/i.test(steel) ? L('Acero inoxidable', 'Stainless steel')
        : L('Acero', 'Steel'),
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
  const category = CATEGORY_OF[p.id] ?? CATEGORY[prefix];
  const finish = finishOf(p.colores, p.id);

  let slug = slugify(t.name);
  if (slugs.has(slug)) slug += `-${p.id}`;
  slugs.add(slug);

  // ES: original menos notas de foto, o override explícito.
  const esHighlights = (t.es?.highlights ?? p.detalles.filter((_, i) => !(t.esDrop ?? []).includes(i))).map(unhedge);
  if (esHighlights.length !== t.highlights.length) throw new Error(`Highlights desalineados en ${p.id}`);
  const highlights = esHighlights.map((es, i) => L(es, unhedge(t.highlights[i])));

  // Imágenes: originales + detalle macro al final (las pulseras con fotos reales llevan su propio orden).
  const names = p.imagenes.map((r) => path.basename(r, path.extname(r)));
  const imgOf = (n, role, alt) => {
    const m = media.images[n];
    if (!m) throw new Error(`Sin metadatos de imagen: ${n}`);
    return { src: m.src, width: m.width, height: m.height, blur: m.blur, tone: m.tone, focal: m.focal, role, alt };
  };
  let images;
  let detailIndex; // undefined = sin primer plano
  if (media.spin?.[p.id]) {
    const has = (k) => media.images[`${p.id}-${k}`];
    if (has('base')) {
      // Foto base (principal), con modelo y macro (primer plano).
      images = [
        imgOf(`${p.id}-base`, 'main', L(p.nombre, t.name)),
        // La foto con modelo y el macro son opcionales (collares, pulseras y anillos traen foto en blanco y con modelo; pu01 solo la foto en blanco).
        ...(has('modelo') ? [imgOf(`${p.id}-modelo`, 'lifestyle', L(`${p.nombre}, puestos`, `${t.name}, worn`))] : []),
        ...(has('macro') ? [imgOf(`${p.id}-macro`, 'detail', L(`Detalle de ${p.nombre}`, `Close-up detail of ${t.name}`))] : []),
      ];
      detailIndex = images.length > 1 ? images.length - 1 : undefined;
    } else {
      // Primeros diseños: par, pieza individual y puestos (la de modelo hace de primer plano).
      images = [
        imgOf(`${p.id}-par`, 'main', L(p.nombre, t.name)),
        imgOf(`${p.id}-individual`, 'main', L(`${p.nombre}, pieza individual`, `${t.name}, single piece`)),
        imgOf(`${p.id}-modelo`, 'detail', L(`${p.nombre}, puestos`, `${t.name}, worn`)),
      ];
      detailIndex = 2;
    }
  } else if (media.images[`${p.id}-frontal`]) {
    // Relojes con las 4 vistas de fotos/relojes-premium (scripts/build-relojes.mjs): frontal, 45°, macro y posterior.
    images = [
      imgOf(`${p.id}-frontal`, 'main', L(p.nombre, t.name)),
      imgOf(`${p.id}-45`, 'main', L(`${p.nombre}, de lado`, `${t.name}, angled view`)),
      imgOf(`${p.id}-macro`, 'detail', L(`Detalle de ${p.nombre}`, `Close-up detail of ${t.name}`)),
      imgOf(`${p.id}-posterior`, 'main', L(`${p.nombre}, vista posterior`, `${t.name}, back view`)),
      // Fotos anteriores de otras variantes (rw02, rw03, st01) y la segunda variante de rw05.
      ...(WATCH_EXTRA[p.id] ?? []).map(([key, role, es, en]) => imgOf(key, role, L(`${p.nombre}, ${es}`, `${t.name}, ${en}`))),
    ];
    detailIndex = 2;
  } else {
    images = names.map((n, i) => {
      const worn = LIFESTYLE.has(p.id) && i === 0;
      return imgOf(n, worn ? 'lifestyle' : 'main', L(worn ? `${p.nombre}, usada` : p.nombre, worn ? `${t.name}, worn` : t.name));
    });
    // Los recortes automáticos de joyería quedaban cortados o vacíos: solo se conservan los de relojes y sets (y los close-ups reales de las pulseras).
    if (AUTO_DETAIL.test(p.id)) {
      const dm = media.images[`${p.id}-detail`];
      images.push({
        src: dm.src, width: dm.width, height: dm.height, blur: dm.blur, tone: dm.tone, focal: dm.focal, role: 'detail',
        alt: L(`Detalle de ${p.nombre}`, `Close-up detail of ${t.name}`),
      });
      detailIndex = images.length - 1;
    }
  }

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
    description: L(unhedge(p.descripcion), unhedge(t.description)),
    story: L(unhedge(p.descripcionLarga), unhedge(t.story)),
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
    spin: media.spin?.[p.id],
    hoverMedia: hasVideo ? { type: 'video', key: `product.${p.id}` } : detailIndex !== undefined ? { type: 'image', imageIndex: detailIndex } : undefined,
    highlights,
    specifications: withDetails(p.id, buildSpecs(p, t, finish, esHighlights)),
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
      description: L(unhedge(p.descripcion), unhedge(t.description)),
    },
  });
}

// Camisas (scripts/data/shirts.json): precio y tallas confirmados por la tienda; stock inicial editable en el panel.
const shirts = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/shirts.json'), 'utf8'));
const NECK = { crew: L('Redondo', 'Crew neck'), v: L('En V', 'V-neck') };
const SHIRT_STORY = L(
  'Las camisas de Clover son de poli-algodón y se estampan con sublimación de tinta o DTF, según el color de la tela. Si quieres otra frase, otra imagen o tu propio diseño, la personalizamos a pedido: escríbenos por WhatsApp y te enviamos la cotización.',
  'Clover T-shirts are poly-cotton, printed by ink sublimation or DTF depending on the fabric color. If you want a different phrase, another image or your own design, we customize it on request: message us on WhatsApp and we will send you a quote.',
);
for (const s of shirts.items) {
  const img = (x, role, alt) => ({ src: x.src, width: x.width, height: x.height, blur: x.blur, tone: x.tone, focal: x.focal, role, alt });
  // Galería (scripts/build-camisas.mjs): en el cuerpo, plana, close-up del estampado, otro ángulo y posterior.
  const view = (key, role, es, en) => {
    const m = media.images[`${s.id}-${key}`];
    if (!m) throw new Error(`Sin metadatos de imagen: ${s.id}-${key} (node scripts/build-camisas.mjs)`);
    return img(m, role, L(es, en));
  };
  const images = [
    view('cuerpo', 'lifestyle', s.alt.es, s.alt.en),
    view('flatlay', 'main', `${s.name.es}, vista frontal`, `${s.name.en}, front view`),
    view('closeup', 'detail', `Detalle del estampado de la ${s.name.es}`, `Close-up of the ${s.name.en} print`),
    view('otro', 'lifestyle', `${s.name.es}, otro ángulo`, `${s.name.en}, another angle`),
    view('posterior', 'main', `${s.name.es}, vista de espalda`, `${s.name.en}, back view`),
  ];
  const variants = shirts.sizes.map((size) => ({
    id: `${s.id}-${size.toLowerCase()}`,
    sku: `CLV-${s.id.toUpperCase()}-${size}`,
    options: { color: s.color, size: L(size, size) },
    imageIndex: 0,
    stock: shirts.stockPerSize,
  }));
  const specifications = [
    { label: L('Material', 'Material'), value: L('Poli-algodón', 'Poly-cotton') },
    { label: L('Color', 'Color'), value: s.color },
    { label: L('Cuello', 'Neckline'), value: NECK[s.neck] },
    { label: L('Tallas', 'Sizes'), value: L(shirts.sizes.join(', '), shirts.sizes.join(', ')) },
    { label: L('Estampado', 'Print'), value: L('Sublimación de tinta o DTF, según el color de la camisa', 'Ink sublimation or DTF, depending on the shirt color') },
    { label: L('Personalización', 'Customization'), value: L('A pedido; se cotiza por WhatsApp', 'On request; quoted via WhatsApp') },
  ];
  let slug = slugify(s.name.en.replace(/['’]/g, ''));
  if (slugs.has(slug)) slug += `-${s.id}`;
  slugs.add(slug);
  catalog.push({
    id: s.id,
    slug,
    name: s.name,
    description: s.description,
    story: SHIRT_STORY,
    category: 'shirts',
    categories: ['shirts', 'women', 'new-arrivals'],
    audience: ['women'],
    tags: ['shirt', 'customizable', ...s.tags],
    price: cents(shirts.price),
    currency: 'USD',
    material: L('Poli-algodón', 'Poly-cotton'),
    color: [s.color],
    customizable: true,
    sizes: shirts.sizes.map((size) => L(size, size)),
    variants,
    images,
    videos: [],
    thumbnail: images[0].src,
    // Al pasar el ratón: la camisa plana.
    hoverMedia: { type: 'image', imageIndex: 1 },
    highlights: [
      L('Poli-algodón', 'Poly-cotton'),
      L(`Tallas ${shirts.sizes.slice(0, -1).join(', ')} y ${shirts.sizes.at(-1)}`, `Sizes ${shirts.sizes.slice(0, -1).join(', ')} and ${shirts.sizes.at(-1)}`),
      L('Estampado por sublimación de tinta o DTF', 'Printed by ink sublimation or DTF'),
      L('Personalizable a pedido; se cotiza por WhatsApp', 'Customizable on request; quoted via WhatsApp'),
    ],
    specifications: withDetails(s.id, specifications),
    stock: variants.reduce((n, v) => n + v.stock, 0),
    featured: false,
    newArrival: true,
    bestseller: false,
    seo: { title: L(`${s.name.es} | Clover`, `${s.name.en} | Clover`), description: s.description },
  });
}

// Lentes de sol (scripts/data/sunglasses.json, fotos con scripts/build-lentes.mjs): frente, perfil, detalle de la bisagra y modelo.
const sunglasses = JSON.parse(fs.readFileSync(path.join(root, 'scripts/data/sunglasses.json'), 'utf8'));
const SUN_STORY = L(
  'Monturas doradas de líneas geométricas, ovaladas, hexagonales o rectangulares, con lentes en gris oscuro o en marrón. Cada modelo se ve en cuatro fotos: de frente, de perfil, el detalle de la bisagra y puesto.',
  'Gold frames with geometric lines (oval, hexagonal or rectangular) and dark gray or brown lenses. Every model comes in four photos: front, profile, hinge detail and worn.',
);
for (const s of sunglasses.items) {
  const view = (key, role, es, en) => {
    const m = media.images[`${s.id}-${key}`];
    if (!m) throw new Error(`Sin metadatos de imagen: ${s.id}-${key} (node scripts/build-lentes.mjs)`);
    return { src: m.src, width: m.width, height: m.height, blur: m.blur, tone: m.tone, focal: m.focal, role, alt: L(es, en) };
  };
  const images = [
    view('frente', 'main', `${s.name.es}, vista de tres cuartos`, `${s.name.en}, three-quarter view`),
    view('modelo', 'lifestyle', `${s.name.es}, puestos`, `${s.name.en}, worn`),
    view('perfil', 'main', `${s.name.es}, vista de perfil`, `${s.name.en}, side view`),
    view('macro', 'detail', `Detalle de la bisagra de los ${s.name.es.toLowerCase()}`, `Hinge detail of the ${s.name.en.toLowerCase()}`),
  ];
  const variants = [{ id: `${s.id}-1`, sku: `CLV-${s.id.toUpperCase()}-1`, options: { color: s.color, size: ONE_SIZE }, imageIndex: 0, stock: sunglasses.stock }];
  const specifications = [
    { label: L('Montura', 'Frame'), value: L('Dorada', 'Gold') },
    { label: L('Forma', 'Shape'), value: s.shape },
    { label: L('Lente', 'Lens'), value: s.lens },
    { label: L('Patillas', 'Arms'), value: s.temples },
    { label: L('Talla', 'Size'), value: ONE_SIZE },
  ];
  let slug = slugify(s.name.en);
  if (slugs.has(slug)) slug += `-${s.id}`;
  slugs.add(slug);
  catalog.push({
    id: s.id,
    slug,
    name: s.name,
    description: s.description,
    story: SUN_STORY,
    category: 'sunglasses',
    categories: ['sunglasses', 'women', 'gifts', 'new-arrivals'],
    audience: ['women'],
    tags: ['sunglasses', 'gift'],
    price: cents(sunglasses.price),
    currency: 'USD',
    material: L('Montura metálica dorada', 'Gold-tone metal frame'),
    color: [s.color],
    finish: 'gold',
    sizes: [ONE_SIZE],
    variants,
    images,
    videos: [],
    thumbnail: images[0].src,
    // Al pasar el ratón: el modelo con los lentes puestos.
    hoverMedia: { type: 'image', imageIndex: 1 },
    highlights: [
      L(`Forma ${s.shape.es.toLowerCase()}`, `${s.shape.en} shape`),
      L(`Lente ${s.lens.es.toLowerCase()}`, `${s.lens.en} lens`),
      L(`Patillas: ${s.temples.es.toLowerCase()}`, `Arms: ${s.temples.en.toLowerCase()}`),
    ],
    specifications: withDetails(s.id, specifications),
    stock: sunglasses.stock,
    featured: false,
    newArrival: true,
    bestseller: false,
    seo: { title: L(`${s.name.es} | Clover`, `${s.name.en} | Clover`), description: s.description },
  });
}

for (const id of Object.keys(details)) if (!usedDetails.has(id)) throw new Error(`product-details.json: el id «${id}» no existe en el catálogo`);

fs.writeFileSync(path.join(root, 'src/content/catalog.generated.json'), JSON.stringify(catalog, null, 1) + '\n');
fs.writeFileSync(path.join(root, 'docs/seed-excluded.json'), JSON.stringify(excluded, null, 2) + '\n');
console.log(`✔ ${catalog.length} productos · ${excluded.length} excluidos (ver docs/seed-excluded.json)`);
