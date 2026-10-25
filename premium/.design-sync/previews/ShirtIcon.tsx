import { ShirtIcon } from '@clover/ui';

export const Sizes = () => (
  <div style={{ display: 'flex', gap: 24, alignItems: 'center', color: 'var(--color-forest)' }}>
    <ShirtIcon width={20} height={20} />
    <ShirtIcon width={32} height={32} />
    <ShirtIcon width={48} height={48} />
  </div>
);
export const OnForest = () => (
  <div style={{ background: 'var(--color-forest)', color: 'var(--color-gold-soft)', padding: 16 }}>
    <ShirtIcon width={32} height={32} />
  </div>
);
