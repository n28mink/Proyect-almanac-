import type { FinishKey } from '@/domain/catalog';

export const FINISH_COLORS: Record<FinishKey, { color: string; label: { es: string; en: string } }> = {
  'yellow-gold': { color: '#c9a45c', label: { es: 'Tono dorado', en: 'Gold tone' } },
  'rose-gold': { color: '#c99b8a', label: { es: 'Tono oro rosa', en: 'Rose-gold tone' } },
  silver: { color: '#cfd3d6', label: { es: 'Tono plateado', en: 'Silver tone' } },
};
