import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;

const base = (props: P): P => ({
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  width: 22,
  height: 22,
  ...props,
});

export const SearchIcon = (p: P) => (
  <svg {...base(p)}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></svg>
);
export const UserIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="8.5" r="3.6" /><path d="M4.5 20c.8-3.6 3.7-5.5 7.5-5.5s6.7 1.9 7.5 5.5" /></svg>
);
export const HeartIcon = ({ filled, ...p }: P & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z" /></svg>
);
export const BagIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6.5a3 3 0 0 1 6 0V8" /></svg>
);
export const MenuIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 8h16M4 16h16" /></svg>
);
export const CloseIcon = (p: P) => (
  <svg {...base(p)}><path d="m6 6 12 12M18 6 6 18" /></svg>
);
export const ArrowRightIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 12h15M14 6.5 19.5 12 14 17.5" /></svg>
);
export const ArrowLeftIcon = (p: P) => (
  <svg {...base(p)}><path d="M20 12H5M10 6.5 4.5 12 10 17.5" /></svg>
);
export const ChevronIcon = (p: P) => (
  <svg {...base(p)}><path d="m6 9 6 6 6-6" /></svg>
);
export const PlusIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>
);
export const MinusIcon = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14" /></svg>
);
export const FilterIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
);
export const TruckIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7.5" cy="17.5" r="1.7" /><circle cx="17" cy="17.5" r="1.7" /></svg>
);
export const ReturnIcon = (p: P) => (
  <svg {...base(p)}><path d="M9 7 4.5 11.5 9 16M5 11.5h9.5a5 5 0 0 1 0 10H12" transform="translate(0 -3)" /></svg>
);
export const CubeIcon = (p: P) => (
  <svg {...base(p)}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3ZM12 12l8-4.5M12 12v9M12 12 4 7.5" /></svg>
);
export const GridIcon = (p: P) => (
  <svg {...base(p)}><rect x="4" y="4" width="6.5" height="6.5" /><rect x="13.5" y="4" width="6.5" height="6.5" /><rect x="4" y="13.5" width="6.5" height="6.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" /></svg>
);
export const ListIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
);
export const EyeIcon = (p: P) => (
  <svg {...base(p)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></svg>
);
/** Pago móvil: teléfono con flechas de envío. */
export const MobilePayIcon = (p: P) => (
  <svg {...base(p)}><rect x="6.5" y="2.8" width="11" height="18.4" rx="2.2" /><path d="M10.5 18.2h3M9.2 8.6h5.6l-1.7-1.7M14.8 12.2H9.2l1.7 1.7" /></svg>
);
/** Transferencia bancaria. */
export const BankIcon = (p: P) => (
  <svg {...base(p)}><path d="M3.5 9 12 4.2 20.5 9M4.5 9.5h15M6 9.5v7.5M10 9.5v7.5M14 9.5v7.5M18 9.5v7.5M3.5 19.8h17" /></svg>
);
/** Efectivo: billete. */
export const CashIcon = (p: P) => (
  <svg {...base(p)}><rect x="2.8" y="6.3" width="18.4" height="11.4" rx="1.6" /><circle cx="12" cy="12" r="2.6" /><path d="M6.2 9.4h.01M17.8 14.6h.01" strokeWidth={2.2} /></svg>
);
/** WhatsApp: globo de conversación con auricular. */
export const WhatsAppIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 11.6a7.6 7.6 0 0 1-11.2 6.7L4.4 19.6l1.4-4.1A7.6 7.6 0 1 1 20 11.6Z" />
    <path d="M9.3 8.7c.2-.4.6-.4.9-.2l.9 1.4c.1.3 0 .5-.2.8l-.4.5c.5 1 1.3 1.8 2.3 2.3l.5-.4c.3-.2.5-.3.8-.2l1.4.9c.3.2.3.6.1.9-.5.8-1.5 1.2-2.4.9-2.3-.7-4-2.4-4.7-4.7-.2-.9 0-1.6.8-2Z" />
  </svg>
);

/* Iconos de categoría del menú Productos. */
export const GemIcon = (p: P) => (
  <svg {...base(p)}><path d="M7 4h10l3.5 5L12 20 3.5 9 7 4Z" /><path d="M3.5 9h17M9.5 4 8 9l4 11 4-11-1.5-5" /></svg>
);
export const WatchIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="4.8" /><path d="M12 9.6V12l1.8 1.1M9.2 7.2 9.8 3h4.4l.6 4.2M9.2 16.8 9.8 21h4.4l.6-4.2" /></svg>
);
export const SunglassesIcon = (p: P) => (
  <svg {...base(p)}><path d="M2.8 9.2h7.7v3.6a3.9 3.9 0 0 1-3.9 3.9h0a3.9 3.9 0 0 1-3.8-3.9V9.2ZM13.5 9.2h7.7v3.6a3.9 3.9 0 0 1-3.8 3.9h0a3.9 3.9 0 0 1-3.9-3.9V9.2Z" /><path d="M10.5 10.6a1.5 1.5 0 0 1 3 0M2.8 9.2 2 6.6M21.2 9.2l.8-2.6" /></svg>
);
export const ShirtIcon = (p: P) => (
  <svg {...base(p)}><path d="M8.5 4 3.5 6.5l2 4 2.5-1V20h8V9.5l2.5 1 2-4L15.5 4a3.6 3.6 0 0 1-7 0Z" /></svg>
);
export const CollectionIcon = (p: P) => (
  <svg {...base(p)}><path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8 12 3.5Z" /><path d="m3.5 12 8.5 4.5 8.5-4.5M3.5 16l8.5 4.5 8.5-4.5" /></svg>
);
export const GiftIcon = (p: P) => (
  <svg {...base(p)}><path d="M4 10h16v10H4V10ZM3 7h18v3H3V7ZM12 7v13" /><path d="M12 7c-2.2 0-3.8-.9-3.8-2.3 0-1.1.9-1.7 1.9-1.5C11.5 3.5 12 5.2 12 7Zm0 0c2.2 0 3.8-.9 3.8-2.3 0-1.1-.9-1.7-1.9-1.5C12.5 3.5 12 5.2 12 7Z" /></svg>
);
export const ChevronDownIcon = (p: P) => (
  <svg {...base(p)}><path d="m6 9.5 6 6 6-6" /></svg>
);

const categoryIcons = { jewelry: GemIcon, watches: WatchIcon, shirts: ShirtIcon, sunglasses: SunglassesIcon, collections: CollectionIcon, gifts: GiftIcon } as const;
export type CategoryIconKey = keyof typeof categoryIcons;
export function CategoryIcon({ slug, ...p }: P & { slug: string }) {
  const Icon = categoryIcons[slug as CategoryIconKey];
  return Icon ? <Icon {...p} /> : null;
}
