'use client';

import { create } from 'zustand';

type PanelId = 'cart' | 'menu' | 'search' | 'filters' | null;

interface UiState {
  panel: PanelId;
  openPanel: (p: Exclude<PanelId, null>) => void;
  closePanel: () => void;
  /** Mensaje para la región aria-live global (carrito, favoritos…). */
  announcement: string;
  announce: (msg: string) => void;
}

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
}));
