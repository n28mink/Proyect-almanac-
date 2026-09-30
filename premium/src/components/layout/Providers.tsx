'use client';

import type { ReactNode } from 'react';
import { FlyToCartProvider } from '@/components/motion/fly-to-cart';
import { PageTransitionProvider } from '@/components/motion/PageTransition';
import { SmoothScroll } from '@/components/motion/SmoothScroll';
import { useUi } from '@/stores/ui-store';
import { StoreHydrator } from './StoreHydrator';

function LiveRegion() {
  const message = useUi((s) => s.announcement);
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SmoothScroll>
      <PageTransitionProvider>
        <FlyToCartProvider>
          <StoreHydrator />
          {children}
          <LiveRegion />
        </FlyToCartProvider>
      </PageTransitionProvider>
    </SmoothScroll>
  );
}
