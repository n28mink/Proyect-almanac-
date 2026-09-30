'use client';

import { useTranslations } from 'next-intl';
import { HeartIcon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';
import { syncWishlistAction } from '@/server/actions/account';
import { useUi } from '@/stores/ui-store';
import { useWishlist } from '@/stores/wishlist-store';

/** Corazón de favoritos. aria-pressed, anuncio aria-live y sincronización con la cuenta si hay sesión. */
export function WishlistButton({ productId, name, className }: { productId: string; name: string; className?: string }) {
  const t = useTranslations('common');
  const active = useWishlist((s) => s.ids.includes(productId));
  const toggle = useWishlist((s) => s.toggle);
  const announce = useUi((s) => s.announce);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? t('removeFavorite', { name }) : t('addFavorite', { name })}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const on = toggle(productId);
        announce(on ? t('favoriteAdded', { name }) : t('favoriteRemoved', { name }));
        void syncWishlistAction(useWishlist.getState().ids).catch(() => undefined);
      }}
      className={cn('grid h-11 w-11 place-items-center text-ink transition-transform duration-300 hover:scale-110 active:scale-95', className)}
    >
      <HeartIcon filled={active} width={20} height={20} className={active ? 'text-bronze' : undefined} />
    </button>
  );
}
