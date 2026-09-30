'use client';

import { create } from 'zustand';
import type { CurrencyCode } from '@/domain/commerce';

type PanelId = 'cart' | 'menu' | 'search' | 'filters' | null;

interface UiState {
  panel: PanelId;
  openPanel: (p: Exclude<PanelId, null>) => void;
  closePanel: () => void;
  /** Mensaje para la región aria-live global (carrito, favoritos…). */
  announcement: string;
  announce: (msg: string) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
}

const CURRENCY_KEY = 'clover-currency';

export const useUi = create<UiState>((set) => ({
  panel: null,
  openPanel: (panel) => set({ panel }),
  closePanel: () => set({ panel: null }),
  announcement: '',
  announce: (announcement) => {
    // Se vacía primero para que el mismo texto repetido vuelva a anunciarse.
    set({ announcement: '' });
    setTimeout(() => set({ announcement }), 30);
  },
  currency: 'USD',
  setCurrency: (currency) => {
    try {
      localStorage.setItem(CURRENCY_KEY, currency);
    } catch {}
    set({ currency });
  },
}));

/** Lee la moneda guardada tras hidratar (el SSR siempre renderiza USD para evitar desajustes). */
export function hydrateCurrency() {
  try {
    const saved = localStorage.getItem(CURRENCY_KEY);
    if (saved === 'USD' || saved === 'EUR' || saved === 'GBP' || saved === 'MXN') useUi.setState({ currency: saved });
  } catch {}
}
