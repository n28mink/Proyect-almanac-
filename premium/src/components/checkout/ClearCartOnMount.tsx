'use client';

import { useEffect } from 'react';
import { useCart } from '@/stores/cart-store';

/** Al volver de un pago confirmado (p. ej. tras Stripe), el carrito ya no debe conservar esas líneas. */
export function ClearCartOnMount() {
  useEffect(() => {
    useCart.getState().clear();
  }, []);
  return null;
}
