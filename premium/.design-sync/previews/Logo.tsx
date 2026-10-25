import { Logo } from '@clover/ui';

export const Inline = () => <Logo />;
export const Stacked = () => <Logo stacked />;
export const NoSubtitle = () => <Logo subtitle={false} />;
export const OnForest = () => <div data-tone="evergreen" style={{ background: 'var(--color-forest)', color: 'var(--color-ivory)', padding: 24, ['--logo-fg' as string]: 'var(--color-ivory)' }}><Logo stacked /></div>;
