import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { categories } from '@/config/taxonomy';
import { bezier, cssEase, duration, gsapEase } from '@/config/motion';
import { collections } from '@/content/collections';
import { getVideo, listVideoKeys } from '@/content/media';
import { defaultCampaigns } from '@/content/campaigns';
import { baseCatalog } from '@/server/repositories/catalog';
import en from '../../messages/en.json';
import es from '../../messages/es.json';

const root = path.resolve(__dirname, '../..');
const flat = (o: Record<string, unknown>, p = ''): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' && v ? flat(v as Record<string, unknown>, `${p}${k}.`) : [`${p}${k}`]));

describe('catálogo', () => {
  const catalog = baseCatalog();
  it('valida contra el esquema (baseCatalog lanza si no)', () => expect(catalog.length).toBeGreaterThan(50));
  it('ids y slugs únicos', () => {
    expect(new Set(catalog.map((p) => p.id)).size).toBe(catalog.length);
    expect(new Set(catalog.map((p) => p.slug)).size).toBe(catalog.length);
  });
  it('todas las imágenes existen en /public y tienen alt localizado', () => {
    for (const p of catalog) for (const i of p.images) {
      expect(fs.existsSync(path.join(root, 'public', i.src)), `${p.id} ${i.src}`).toBe(true);
      expect(i.alt.es.length).toBeGreaterThan(2);
      expect(i.alt.en.length).toBeGreaterThan(2);
    }
  });
  it('textos y especificaciones existen en ambos idiomas', () => {
    for (const p of catalog) {
      for (const t of [p.name, p.description, p.story]) { expect(t.es.length).toBeGreaterThan(3); expect(t.en.length).toBeGreaterThan(3); }
      expect(p.specifications.length).toBeGreaterThan(2);
    }
  });
  it('categorías, colecciones y vídeos referenciados existen', () => {
    const cats = new Set(categories.map((c) => c.slug));
    for (const p of catalog) {
      expect(p.categories.every((c) => cats.has(c)), p.id).toBe(true);
      for (const v of p.videos) expect(listVideoKeys().includes(v), `${p.id} → ${v}`).toBe(true);
      if (p.collection) expect(collections.some((c) => c.slug === p.collection)).toBe(true);
    }
    for (const c of categories) expect(catalog.some((p) => p.id === c.coverProductId), c.slug).toBe(true);
  });
  it('camisas estandarizadas: 12 USD, tallas S–XL, poli-algodón, personalizables y sin acabado de metal', () => {
    const shirts = catalog.filter((p) => p.category === 'shirts');
    expect(shirts.map((p) => p.id)).toEqual(['cm01', 'cm02', 'cm03', 'cm04', 'cm05']);
    for (const s of shirts) {
      expect(s.price).toBe(1200);
      expect(s.variants.map((v) => v.options.size.es)).toEqual(['S', 'M', 'L', 'XL']);
      expect(s.material.es).toBe('Poli-algodón');
      expect(s.customizable).toBe(true);
      expect(s.finish).toBeUndefined();
      expect(s.images.some((i) => i.role === 'detail')).toBe(true);
    }
  });
  it('los importes son céntimos enteros y el stock total coincide con las variantes', () => {
    for (const p of catalog) {
      expect(Number.isInteger(p.price)).toBe(true);
      expect(p.stock).toBe(p.variants.reduce((s, v) => s + v.stock, 0));
    }
  });
});

describe('textos de contacto', () => {
  it('la barra superior dice «Entregas en Venezuela, Maracay» y ningún texto fijo menciona precios en USD', () => {
    expect(defaultCampaigns.announcements.some((a) => a.es === 'Entregas en Venezuela, Maracay')).toBe(true);
    for (const a of defaultCampaigns.announcements) expect(`${a.es} ${a.en}`).not.toMatch(/USD/);
    expect(es.footer.pricesNote).toBe('Pedidos por WhatsApp.');
    expect(en.footer.pricesNote).not.toMatch(/USD/);
  });
  it('los textos legales no llevan el número: usan la marca que la página convierte en el icono de WhatsApp', async () => {
    const { legalDocs, WA_TOKEN, plainLegal } = await import('@/content/legal');
    const all = legalDocs.flatMap((d) => d.sections.flatMap((s) => [s.text.es, s.text.en]));
    for (const t of all) expect(t).not.toMatch(/131\s?8133/);
    expect(all.some((t) => t.includes(WA_TOKEN))).toBe(true);
    expect(plainLegal(`escríbenos por ${WA_TOKEN}`)).toBe('escríbenos por WhatsApp');
  });
});

describe('media registry', () => {
  it('las campañas de la home apuntan a vídeos con archivos reales', () => {
    for (const b of [defaultCampaigns.hero, defaultCampaigns.jewelry, defaultCampaigns.watches, defaultCampaigns.fashion, defaultCampaigns.story]) {
      const v = getVideo(b.videoKey);
      expect(v, b.videoKey).not.toBeNull();
      for (const s of [...v!.sources.desktop, ...(v!.sources.mobile ?? [])]) expect(fs.existsSync(path.join(root, 'public', s.src)), s.src).toBe(true);
      expect(fs.existsSync(path.join(root, 'public', v!.poster.desktop.src))).toBe(true);
    }
  });
});

describe('tokens de movimiento (TS ↔ CSS)', () => {
  const css = fs.readFileSync(path.join(root, 'src/styles/tokens.css'), 'utf8');
  it('las duraciones CSS coinciden con motion.ts', () => {
    for (const [k, v] of Object.entries(duration)) expect(css).toContain(`--dur-${k}: ${Math.round(v * 1000)}ms;`);
  });
  it('las curvas CSS coinciden con motion.ts', () => {
    const map = { luxe: 'luxe', expo: 'expo', curtain: 'curtain', inOut: 'in-out-luxe', out: 'out', drawer: 'drawer' } as const;
    for (const [k, name] of Object.entries(map)) expect(css).toContain(`--ease-${name}: ${cssEase(k as keyof typeof bezier)};`);
  });
  it('gsapEase es monótona, acotada y reproduce los extremos', () => {
    for (const k of Object.keys(bezier) as Array<keyof typeof bezier>) {
      const f = gsapEase(k);
      expect(f(0)).toBe(0);
      expect(f(1)).toBe(1);
      for (const t of [0.1, 0.5, 0.9]) expect(f(t)).toBeGreaterThanOrEqual(-0.001);
    }
  });
});

describe('i18n', () => {
  it('es y en tienen exactamente las mismas claves', () => {
    expect(flat(es).sort()).toEqual(flat(en).sort());
  });
  it('ningún texto está vacío', () => {
    for (const m of [en, es]) for (const k of flat(m)) expect(k.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], m)).not.toBe('');
  });
});
