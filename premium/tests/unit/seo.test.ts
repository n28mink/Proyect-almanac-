import { describe, expect, it } from 'vitest';
import { fitDescription } from '@/lib/seo';

describe('fitDescription', () => {
  it('completa las descripciones cortas hasta 120–160 caracteres', () => {
    for (const base of ['Nuestra historia.', 'Aretes dorados de botón en forma de hoja', 'x'.repeat(80)]) {
      for (const locale of ['es', 'en'] as const) {
        const d = fitDescription(base, locale);
        expect(d.length).toBeGreaterThanOrEqual(120);
        expect(d.length).toBeLessThanOrEqual(160);
      }
    }
  });
  it('recorta las largas en una palabra entera', () => {
    const d = fitDescription('palabra '.repeat(40), 'es');
    expect(d.length).toBeLessThanOrEqual(160);
    expect(d.endsWith('…')).toBe(true);
  });
  it('deja intactas las que ya están en rango', () => {
    const ok = 'a'.repeat(140);
    expect(fitDescription(ok, 'es')).toBe(ok);
  });
});
