'use client';

import { useEffect } from 'react';

/**
 * Abre WhatsApp con el pedido ya escrito apenas aparece la confirmación, sin un toque más del cliente.
 * Solo se dispara si el toque de «Hacer pedido» sigue activo (`navigator.userActivation`): los navegadores del celular
 * solo dejan abrir la app de WhatsApp desde un gesto reciente, y sin él se vería la página de wa.me con otro botón.
 * Al recargar o volver atrás ya no hay gesto activo (y se recuerda por pedido), así que no redirige otra vez: queda el
 * botón «Enviar pedido por WhatsApp» como respaldo.
 */
export function AutoOpenWhatsApp({ href, order }: { href: string; order: string }) {
  useEffect(() => {
    const key = `clover-wa-${order}`;
    try {
      if (sessionStorage.getItem(key)) return;
      if (!navigator.userActivation?.isActive) return;
      sessionStorage.setItem(key, '1');
    } catch {
      return;
    }
    window.location.assign(href);
  }, [href, order]);
  return null;
}
