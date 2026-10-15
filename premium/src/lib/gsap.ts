'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

/** Único punto de registro de GSAP: importar siempre desde aquí, nunca `gsap` directamente. */
let registered = false;
export function registerGsap() {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger, useGSAP);
  // La barra de direcciones del móvil cambia la altura al hacer scroll: sin esto cada cambio recalcula todos los ScrollTrigger y el scroll da tirones.
  ScrollTrigger.config({ ignoreMobileResize: true });
  registered = true;
}
registerGsap();

export { gsap, ScrollTrigger, useGSAP };
