'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Quote } from '@/domain/commerce';
import { quoteCartAction } from '@/server/actions/shop';
import { useCart } from '@/stores/cart-store';

interface QuoteState {
  quote: Quote | null;
  loading: boolean;
  error: boolean;
  refresh: () => void;
}

/**
 * Valoración del carrito hecha por el servidor (precios, stock, promo, envío). El cliente nunca calcula importes.
 * Debounce corto y descarte de respuestas obsoletas.
 */
export function useCartQuote(enabled = true, country = 'VE'): QuoteState {
  const lines = useCart((s) => s.lines);
  const promoCode = useCart((s) => s.promoCode);
  const shippingMethod = useCart((s) => s.shippingMethod);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const seq = useRef(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (lines.length === 0) {
      setQuote(null);
      setLoading(false);
      setError(false);
      return;
    }
    const id = ++seq.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await quoteCartAction({ lines, promoCode: promoCode || undefined, shippingMethod, country });
      if (id !== seq.current) return;
      setLoading(false);
      if (res.ok) {
        setQuote(res.quote);
        setError(false);
      } else setError(true);
    }, 180);
    return () => clearTimeout(timer);
  }, [enabled, lines, promoCode, shippingMethod, country, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);
  return { quote, loading, error, refresh };
}
