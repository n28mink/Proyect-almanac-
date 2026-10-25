import { TruckIcon } from '@clover/ui';

export const Sizes = () => (
  <div style={{ display: 'flex', gap: 24, alignItems: 'center', color: 'var(--color-forest)' }}>
    <TruckIcon width={20} height={20} />
    <TruckIcon width={32} height={32} />
    <TruckIcon width={48} height={48} />
  </div>
);
export const OnForest = () => (
  <div style={{ background: 'var(--color-forest)', color: 'var(--color-gold-soft)', padding: 16 }}>
    <TruckIcon width={32} height={32} />
  </div>
);
