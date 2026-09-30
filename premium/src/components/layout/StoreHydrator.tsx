'use client';

import { useEffect } from 'react';
import { loadWishlistAction, syncWishlistAction } from '@/server/actions/account';
import { useCart } from '@/stores/cart-store';
import { hydrateCurrency } from '@/stores/ui-store';
import { useWishlist } from '@/stores/wishlist-store';

/**
 * Hidrata los stores persistentes tras el montaje (el SSR renderiza el estado vacío, sin desajustes)
 * y, si hay sesión, fusiona los favoritos del invitado con los de la cuenta.
 */
export function StoreHydrator() {
  useEffect(() => {
    void useCart.persist.rehydrate();
    void useWishlist.persist.rehydrate();
    hydrateCurrency();
    void (async () => {
      const remote = await loadWishlistAction().catch(() => null);
      if (!remote) return;
      const merged = [...new Set([...remote, ...useWishlist.getState().ids])];
      useWishlist.getState().replace(merged);
      if (merged.length !== remote.length) await syncWishlistAction(merged).catch(() => undefined);
    })();
  }, []);
  return null;
}
