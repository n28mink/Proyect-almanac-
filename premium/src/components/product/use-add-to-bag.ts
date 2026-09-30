'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useFlyToCart } from '@/components/motion/fly-to-cart';
import { useCart } from '@/stores/cart-store';

interface AddArgs {
  productId: string;
  variantId: string;
  quantity?: number;
  name: string;
  imageSrc?: string;
  /** Elemento desde el que "vuela" la imagen (la foto o el botón). */
  source: HTMLElement | null;
}

/** Añade al carrito + vuelo al icono + pulso de insignia + anuncio aria-live. */
export function useAddToBag() {
  const add = useCart((s) => s.add);
  const { fly } = useFlyToCart();
  const t = useTranslations('cart');
  return useCallback(
    ({ productId, variantId, quantity = 1, name, imageSrc, source }: AddArgs) => {
      add({ productId, variantId, quantity });
      fly(source, imageSrc, t('addedNamed', { name }));
    },
    [add, fly, t],
  );
}
