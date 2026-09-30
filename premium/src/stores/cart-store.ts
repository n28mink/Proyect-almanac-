'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/** El carrito del cliente guarda SOLO ids y cantidad. Precios y stock los valora siempre el servidor. */
export interface CartLine {
  productId: string;
  variantId: string;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  /** Última línea quitada, para ofrecer «Deshacer» (las acciones destructivas siempre se pueden revertir). */
  lastRemoved: CartLine | null;
  add: (line: CartLine) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  undoRemove: () => void;
  dismissRemoved: () => void;
  clear: () => void;
  count: () => number;
}

export const MAX_PER_LINE = 10;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      lastRemoved: null,
      add: (line) =>
        set((s) => {
          const existing = s.lines.find((l) => l.variantId === line.variantId);
          if (existing) {
            return { lines: s.lines.map((l) => (l.variantId === line.variantId ? { ...l, quantity: Math.min(MAX_PER_LINE, l.quantity + line.quantity) } : l)) };
          }
          return { lines: [...s.lines, { ...line, quantity: Math.min(MAX_PER_LINE, line.quantity) }] };
        }),
      setQuantity: (variantId, quantity) =>
        set((s) => ({
          lines: quantity <= 0 ? s.lines.filter((l) => l.variantId !== variantId) : s.lines.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_PER_LINE, quantity) } : l)),
        })),
      remove: (variantId) =>
        set((s) => ({ lines: s.lines.filter((l) => l.variantId !== variantId), lastRemoved: s.lines.find((l) => l.variantId === variantId) ?? s.lastRemoved })),
      undoRemove: () =>
        set((s) => (s.lastRemoved && !s.lines.some((l) => l.variantId === s.lastRemoved!.variantId) ? { lines: [...s.lines, s.lastRemoved], lastRemoved: null } : { lastRemoved: null })),
      dismissRemoved: () => set({ lastRemoved: null }),
      clear: () => set({ lines: [], lastRemoved: null }),
      count: () => get().lines.reduce((n, l) => n + l.quantity, 0),
    }),
    { name: 'clover-cart-v2', storage: createJSONStorage(() => localStorage), skipHydration: true, partialize: (s) => ({ lines: s.lines }) },
  ),
);
