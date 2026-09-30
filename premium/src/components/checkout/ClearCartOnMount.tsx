'use client';

import { useEffect } from 'react';
import { useCart } from '@/stores/cart-store';

/** El pedido ya quedó registrado: el carrito no debe conservar esas líneas (también al recargar esta página). */
export function ClearCartOnMount() {
  useEffect(() => {
    useCart.getState().clear();
  }, []);
  return null;
}
