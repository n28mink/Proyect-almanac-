import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/** Link/redirect/useRouter/usePathname conscientes del idioma. Usar siempre estos, no los de `next/navigation`. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
