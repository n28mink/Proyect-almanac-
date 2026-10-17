/**
 * Quita del texto de la tienda las aclaraciones sobre de dónde sale el dato del material
 * («según el empaque», «según la tarjeta del empaque», «según la imagen», «as stated on the packaging»…).
 * La ficha muestra el material tal cual; la fuente original (clover-source.json) no se modifica.
 *  - Frase suelta («Acero inoxidable según el empaque.»): se elimina entera; el material ya está en Especificaciones.
 *  - Paréntesis («Acero inoxidable (según empaque)»): se elimina el paréntesis y queda «Acero inoxidable».
 */
const SENTENCE = [
  /\s*(?:Acero(?: inoxidable)?(?: 304)?)\s+seg[uú]n\s[^.]*\.?/gi,
  /\s*(?:304 )?(?:stainless )?steel as stated\s[^.]*\.?/gi,
];
const PAREN = [/\s*\(\s*seg[uú]n\s[^)]*\)/gi, /\s*\(\s*as stated\s[^)]*\)/gi];

export function unhedge(text) {
  if (typeof text !== 'string') return text;
  let s = text;
  for (const re of PAREN) s = s.replace(re, '');
  // Una frase suelta solo se elimina si el texto tiene más contenido; si es el propio detalle, queda el material sin aclaración.
  for (const re of SENTENCE) {
    const rest = s.replace(re, '').trim();
    if (rest) s = rest;
    else s = s.replace(/\s+seg[uú]n\s.*$/i, '').replace(/\s+as stated\s.*$/i, '').trim();
  }
  return s.trim();
}
