import type { Localized } from '@/domain/i18n';
import { L } from '@/domain/i18n';

export interface Cta {
  label: Localized;
  href: string;
}

export interface CampaignBlock {
  videoKey: string;
  eyebrow: Localized;
  title: Localized;
  text: Localized;
  cta: Cta;
}

export interface HomeCampaigns {
  announcements: Localized[];
  hero: CampaignBlock;
  jewelry: CampaignBlock;
  watches: CampaignBlock;
  fashion: CampaignBlock;
  story: CampaignBlock;
}

/**
 * Campañas de la home. Editables desde /admin/campaigns (override en el almacén de datos)
 * o directamente aquí. `videoKey` apunta al media registry (src/content/media.ts).
 */
export const defaultCampaigns: HomeCampaigns = {
  announcements: [
    L('Pedidos por WhatsApp · Atención personal', 'Orders via WhatsApp · Personal service'),
    L('Entregas en Venezuela · Precios en USD', 'Delivery within Venezuela · Prices in USD'),
    L('Pago móvil, transferencia o efectivo', 'Pago móvil, transfer or cash'),
  ],
  hero: {
    videoKey: 'hero.campaign',
    eyebrow: L('Colección 2026', 'Collection 2026'),
    title: L('Detalles que hacen brillar.', 'Details that make you shine.'),
    text: L('Piezas elegidas una a una, para llevarse de verdad.', 'Pieces chosen one by one, made to be truly worn.'),
    cta: { label: L('Descubrir la colección', 'Discover the collection'), href: '/shop' },
  },
  jewelry: {
    videoKey: 'campaign.jewelry',
    eyebrow: L('Campaña · Joyería', 'Campaign · Jewelry'),
    title: L('La luz también se lleva puesta.', 'Light is worn, too.'),
    text: L('Anillos, aretes y perlas pensados para atrapar el brillo del día.', 'Rings, earrings and pearls designed to catch the glow of the day.'),
    cta: { label: L('Ver joyería', 'Shop jewelry'), href: '/shop/jewelry' },
  },
  watches: {
    videoKey: 'campaign.watches',
    eyebrow: L('Campaña · Relojes', 'Campaign · Watches'),
    title: L('Tiempo con carácter.', 'Time with character.'),
    text: L('Cajas redondas, cuadradas y rectangulares. Elige la esfera que va contigo.', 'Round, square and rectangular cases. Choose the dial that goes with you.'),
    cta: { label: L('Ver relojes', 'Shop watches'), href: '/shop/watches' },
  },
  fashion: {
    videoKey: 'editorial.fashion',
    eyebrow: L('Editorial', 'Editorial'),
    title: L('Puestas, se entienden mejor.', 'Worn, they make more sense.'),
    text: L('Elegimos cada pieza pensando en cómo se ve puesta.', 'We choose each piece thinking about how it looks on.'),
    cta: { label: L('Ver el lookbook', 'View the lookbook'), href: '/lookbook' },
  },
  story: {
    videoKey: 'story.craft',
    eyebrow: L('Nuestra forma de elegir', 'How we choose'),
    title: L('La atención está en el detalle.', 'Attention lives in the detail.'),
    text: L('Texturas, acabados y cierres: revisamos cada pieza de cerca antes de que llegue a ti.', 'Textures, finishes and clasps: we look at every piece up close before it reaches you.'),
    cta: { label: L('Conocer Clover', 'Get to know Clover'), href: '/about' },
  },
};
