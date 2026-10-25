import { Price } from '@clover/ui';

export const Regular = () => <Price cents={4200} className="text-lead" />;
export const OnSale = () => <Price cents={1850} compareAt={2490} className="text-lead" />;
export const Small = () => <Price cents={1200} />;
