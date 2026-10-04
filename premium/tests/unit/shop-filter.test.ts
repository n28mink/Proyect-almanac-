import { describe, expect, it } from 'vitest';
import { toCardData } from '@/lib/card-data';
import { activeCount, applyFilters, computeFacets, parseParams, serializeParams } from '@/lib/shop-filter';
import { formatMoney } from '@/lib/format';
import { baseCatalog } from '@/server/repositories/catalog';

const cards = baseCatalog().map((p, i) => ({ ...toCardData(p, 'en'), order: i }));

describe('filtros de tienda (estado en la URL)', () => {
  it('parsea con valores por defecto seguros ante entradas basura', () => {
    const p = parseParams(new URLSearchParams('sort=hack&min=-5&max=abc&view=zzz&finish=' + 'x,'.repeat(50)));
    expect(p.sort).toBe('featured');
    expect(p.min).toBeUndefined();
    expect(p.max).toBeUndefined();
    expect(p.view).toBe('grid');
    expect(p.finish.length).toBeLessThanOrEqual(12);
  });
  it('serializa y vuelve a parsear sin pérdida', () => {
    const src = 'q=gold&sort=price-asc&min=10&max=30&finish=gold,silver&stock=1&view=list';
    expect(serializeParams(parseParams(new URLSearchParams(src)))).toBe(new URLSearchParams(src).toString());
  });
  it('filtra por precio, tono, texto (sin acentos) y disponibilidad', () => {
    const byPrice = applyFilters(cards, parseParams(new URLSearchParams('max=20')));
    expect(byPrice.every((c) => c.price <= 2000)).toBe(true);
    const gold = applyFilters(cards, parseParams(new URLSearchParams('finish=gold')));
    expect(gold.length).toBeGreaterThan(0);
    expect(gold.every((c) => c.finish === 'gold')).toBe(true);
    expect(gold.some((c) => c.categorySlug === 'shirts')).toBe(false);
    const fabric = applyFilters(cards, parseParams(new URLSearchParams('material=textile')));
    expect(fabric.length).toBe(5);
    expect(computeFacets(cards.filter((c) => c.categorySlug === 'shirts')).finish).toHaveLength(0);
    expect(applyFilters(cards, parseParams(new URLSearchParams('q=zzzz'))).length).toBe(0);
    expect(applyFilters(cards, parseParams(new URLSearchParams('stock=1'))).every((c) => c.inStock)).toBe(true);
  });
  it('ordena por precio', () => {
    const asc = applyFilters(cards, parseParams(new URLSearchParams('sort=price-asc')));
    for (let i = 1; i < asc.length; i++) expect(asc[i]!.price).toBeGreaterThanOrEqual(asc[i - 1]!.price);
  });
  it('oculta facetas sin opciones útiles', () => {
    const rings = cards;
    const f = computeFacets(rings);
    expect(f.price).not.toBeNull();
    const oneMenWatch = cards.filter((c) => c.id === 'rw06');
    expect(computeFacets(oneMenWatch).price).toBeNull();
    expect(computeFacets(oneMenWatch).finish).toHaveLength(0);
  });
  it('cuenta los filtros activos', () => {
    expect(activeCount(parseParams(new URLSearchParams('q=a&min=1&finish=gold,silver&stock=1')))).toBe(5);
  });
});

describe('formato de moneda', () => {
  it('formatea siempre en dólares según el idioma', () => {
    expect(formatMoney(2490, 'en')).toBe('$24.90');
    expect(formatMoney(2490, 'es')).toMatch(/24,90/);
  });
});
