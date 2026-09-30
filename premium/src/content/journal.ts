import type { Localized } from '@/domain/i18n';
import { L } from '@/domain/i18n';

export interface JournalEntry {
  slug: string;
  date: string;
  readMinutes: number;
  coverProductId: string;
  title: Localized;
  excerpt: Localized;
  body: Array<{ heading?: Localized; text: Localized }>;
}

/** Editorial del Journal. Contenido propio; editar aquí o conectar un CMS. */
export const journal: JournalEntry[] = [
  {
    slug: 'como-combinar-dorado-y-plateado', date: '2026-09-12', readMinutes: 4, coverProductId: 'pu13',
    title: L('Cómo combinar dorado y plateado sin miedo', 'How to mix gold and silver tones without fear'),
    excerpt: L('Tres reglas simples para mezclar tonos y que se vea intencional.', 'Three simple rules for mixing tones so it looks intentional.'),
    body: [
      { text: L('Mezclar tonos ya no es un error de estilo: es una decisión. La clave está en repetir, no en dudar.', 'Mixing tones is no longer a style mistake: it is a decision. The key is to repeat, not to hesitate.') },
      { heading: L('1. Repite un elemento', '1. Repeat one element'), text: L('Si llevas aretes dorados y un reloj plateado, suma una pulsera con esferas de los dos tonos para conectar ambos.', 'If you wear gold-tone earrings and a silver-tone watch, add a two-tone bracelet to connect them.') },
      { heading: L('2. Elige un protagonista', '2. Choose a protagonist'), text: L('Una pieza de volumen manda; las demás acompañan con líneas finas.', 'One voluminous piece leads; the others accompany with fine lines.') },
      { heading: L('3. Mira la piel y la ropa', '3. Look at skin and clothing'), text: L('Los tonos cálidos abrigan colores neutros; los plateados refrescan tonos oscuros.', 'Warm tones flatter neutral colors; silver tones refresh dark shades.') },
    ],
  },
  {
    slug: 'guia-de-regalos', date: '2026-08-28', readMinutes: 3, coverProductId: 'co19',
    title: L('Guía de regalos: piezas que dicen algo', 'Gift guide: pieces that say something'),
    excerpt: L('Corazones, lunas y mariposas: símbolos que acompañan un mensaje.', 'Hearts, moons and butterflies: symbols that carry a message.'),
    body: [
      { text: L('Un buen regalo de joyería cuenta una historia. Estos son los símbolos que más se piden y por qué.', 'A good jewelry gift tells a story. These are the most requested symbols and why.') },
      { heading: L('Corazones', 'Hearts'), text: L('Romántico y atemporal. Los corazones inflados se sienten actuales y funcionan para cualquier edad.', 'Romantic and timeless. Puffed hearts feel current and work at any age.') },
      { heading: L('Lunas y estrellas', 'Moons and stars'), text: L('Para quienes sueñan despiertas: delicados y luminosos.', 'For the daydreamers: delicate and luminous.') },
    ],
  },
  {
    slug: 'cuidado-de-tus-piezas', date: '2026-08-05', readMinutes: 3, coverProductId: 'an11',
    title: L('Cuidado de tus piezas para que duren', 'Caring for your pieces so they last'),
    excerpt: L('Hábitos sencillos para conservar el brillo día a día.', 'Simple habits to keep the shine day after day.'),
    body: [
      { text: L('Un poco de atención diaria marca la diferencia en cómo envejece una pieza.', 'A little daily attention makes the difference in how a piece ages.') },
      { heading: L('Límpialas', 'Clean them'), text: L('Con un paño suave y seco después de usarlas.', 'With a soft, dry cloth after wearing.') },
      { heading: L('Guárdalas por separado', 'Store them separately'), text: L('Evita que se rayen entre sí usando bolsitas o compartimentos.', 'Avoid scratches by using pouches or compartments.') },
    ],
  },
];

export function getJournalEntry(slug: string) {
  return journal.find((j) => j.slug === slug);
}
