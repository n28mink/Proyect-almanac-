'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ProductCard } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import type { CardData } from '@/lib/card-data';
import { getCardsAction } from '@/server/actions/catalog';
import { useWishlist } from '@/stores/wishlist-store';

/** Favoritos: los ids viven en el cliente (o en la cuenta); los datos de producto los sirve el servidor. */
export function WishlistGrid() {
  const t = useTranslations('wishlist');
  const locale = useLocale();
  const ids = useWishlist((s) => s.ids);
  const [cards, setCards] = useState<CardData[] | null>(null);

  useEffect(() => {
    let live = true;
    if (ids.length === 0) {
      setCards([]);
      return;
    }
    getCardsAction(ids, locale).then((c) => live && setCards(c)).catch(() => live && setCards([]));
    return () => {
      live = false;
    };
  }, [ids, locale]);

  if (cards === null) {
    return (
      <ul className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4" aria-busy="true" aria-label={t('loading')}>
        {Array.from({ length: 4 }).map((_, i) => <li key={i}><div className="skeleton aspect-[4/5]" /><div className="skeleton mt-4 h-5 w-2/3" /></li>)}
      </ul>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="grid place-items-start gap-6 py-10">
        <p className="font-display text-display-m">{t('emptyTitle')}</p>
        <p className="max-w-md text-fg-muted">{t('emptyText')}</p>
        <ButtonLink href="/shop" transition="curtain">{t('discover')}</ButtonLink>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-12 lg:grid-cols-4 lg:gap-x-8">
      {cards.map((p) => <li key={p.id}><ProductCard p={p} /></li>)}
    </ul>
  );
}
