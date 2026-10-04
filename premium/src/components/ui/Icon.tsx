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
