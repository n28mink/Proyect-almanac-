'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface WishlistState {
  ids: string[];
  toggle: (id: string) => boolean;
  has: (id: string) => boolean;
  replace: (ids: string[]) => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const on = !get().ids.includes(id);
        set({ ids: on ? [...get().ids, id] : get().ids.filter((i) => i !== id) });
        return on;
      },
      has: (id) => get().ids.includes(id),
      replace: (ids) => set({ ids }),
    }),
    { name: 'clover-wishlist-v1', storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);
