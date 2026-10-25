import { ChevronIcon } from '@clover/ui';

export const Sizes = () => (
  <div style={{ display: 'flex', gap: 24, alignItems: 'center', color: 'var(--color-forest)' }}>
    <ChevronIcon width={20} height={20} />
    <ChevronIcon width={32} height={32} />
    <ChevronIcon width={48} height={48} />
  </div>
);
export const OnForest = () => (
  <div style={{ background: 'var(--color-forest)', color: 'var(--color-gold-soft)', padding: 16 }}>
    <ChevronIcon width={32} height={32} />
  </div>
);
