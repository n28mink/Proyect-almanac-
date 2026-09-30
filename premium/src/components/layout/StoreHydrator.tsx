'use client';

import { useEffect } from 'react';
import { useCart } from '@/stores/cart-store';
import { useWishlist } from '@/stores/wishlist-store';

/** Hidrata los stores persistentes tras el montaje (el SSR renderiza el estado vacío, sin desajustes). */
export function StoreHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate();
    void useWishlist.persist.rehydrate();
  }, []);
  return null;
}
