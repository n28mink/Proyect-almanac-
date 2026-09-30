/**
 * Curación del catálogo real de Clover para la tienda premium.
 * Criterio: solo fotografía limpia (sin bolsa de empaque, tarjeta de proveedor ni sellos promocionales visibles).
 */

export const CURATED_IDS = [
  // Relojes + set
  'rw01', 'rw02', 'rw03', 'rw04', 'rw05', 'rw06', 'st01',
  // Anillos
  'an01', 'an02', 'an03', 'an04', 'an05', 'an06', 'an07', 'an08', 'an09', 'an10', 'an11', 'an12',
  // Pulseras
  'pu01', 'pu02', 'pu03', 'pu04', 'pu05', 'pu06', 'pu07', 'pu08', 'pu09', 'pu10', 'pu11', 'pu12', 'pu13',
  // Collares
  'co01', 'co02', 'co03', 'co04', 'co05', 'co06', 'co07', 'co08', 'co09', 'co10', 'co11', 'co12', 'co13', 'co14', 'co15', 'co16', 'co17', 'co18', 'co19',
  // Aretes (solo fotos limpias)
  'ar03', 'ar04', 'ar05', 'ar06', 'ar07', 'ar08', 'ar09', 'ar10', 'ar11', 'ar12', 'ar14', 'ar15', 'ar27', 'ar28', 'ar29', 'ar30', 'ar32', 'ar34', 'ar36', 'ar37', 'ar39', 'ar45',
];

export const EXCLUDED_REASON = {
  packaging: 'La foto muestra bolsa de empaque o tarjeta del proveedor.',
  layout: 'Encuadre no apto (tira horizontal / composición atípica).',
};

/** Recortes para eliminar sellos promocionales o textos de la foto original. Fracciones 0–1. */
export const CROPS = {
  'co13': { left: 0.2, top: 0, width: 0.8, height: 1 },
  'co15': { left: 0.2, top: 0, width: 0.8, height: 1 },
  'co17': { left: 0.2, top: 0, width: 0.8, height: 1 },
  'co18': { left: 0.2, top: 0, width: 0.8, height: 1 },
  'st01': { left: 0, top: 0, width: 1, height: 0.9 },
  'st01-2': { left: 0, top: 0, width: 1, height: 0.9 },
};

/** Fotos con persona o contexto de uso (rol lifestyle). */
export const LIFESTYLE = new Set(['ar10', 'ar11', 'ar37', 'ar39', 'co08', 'co09']);

export function isCropped(name) {
  return Object.prototype.hasOwnProperty.call(CROPS, name);
}
