import type { Collection } from '@/domain/catalog';
import { L } from '@/domain/i18n';

/** Colecciones cápsula. `cover` es un id de producto cuya foto ilustra la colección. */
export const collections: Array<Collection & { coverProductId: string }> = [
  {
    slug: 'lumiere', name: L('Lumière', 'Lumière'), tagline: L('Perlas y luz suave', 'Pearls and soft light'),
    description: L('Perlas, piedras brillantes y lunas: piezas que atrapan la luz y la devuelven con calma.', 'Pearls, sparkling stones and moons: pieces that catch the light and return it with calm.'),
    cover: 'co11', coverProductId: 'co11', tone: 'light',
  },
  {
    slug: 'aurea', name: L('Áurea', 'Aurea'), tagline: L('Dorado escultórico', 'Sculptural gold tone'),
    description: L('Volúmenes, texturas martilladas y bandas entrelazadas en tono dorado para quienes eligen presencia.', 'Volumes, hammered textures and interlaced bands in a gold tone for those who choose presence.'),
    cover: 'an10', coverProductId: 'an10', tone: 'ink',
  },
  {
    slug: 'jardin', name: L('Jardín', 'Garden'), tagline: L('Flores, hojas y tréboles', 'Flowers, leaves and clovers'),
    description: L('Inspiración botánica: flores de cinco pétalos, hojas martilladas y los tréboles que dan nombre a la casa.', 'Botanical inspiration: five-petal flowers, hammered leaves and the clovers that give the house its name.'),
    cover: 'pu08', coverProductId: 'pu08', tone: 'evergreen',
  },
  {
    slug: 'corazon', name: L('Corazón', 'Heart'), tagline: L('Para regalar y guardar', 'To give and to keep'),
    description: L('Corazones inflados, entrelazados y grabados: el gesto romántico en diseños actuales.', 'Puffed, interlaced and engraved hearts: the romantic gesture in current designs.'),
    cover: 'pu06', coverProductId: 'pu06', tone: 'light',
  },
  {
    slug: 'tiempo', name: L('Tiempo', 'Time'), tagline: L('Relojes con carácter', 'Watches with character'),
    description: L('Cajas redondas, cuadradas y rectangulares, con esferas para cada personalidad.', 'Round, square and rectangular cases, with dials for every personality.'),
    cover: 'rw03', coverProductId: 'rw03', tone: 'ink',
  },
];

export function getCollection(slug: string) {
  return collections.find((c) => c.slug === slug);
}
