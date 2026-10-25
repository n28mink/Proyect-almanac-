import { Section, SectionHeading, Button } from '@clover/ui';

const Body = () => (
  <div style={{ padding: '0 24px' }}>
    <SectionHeading size="m" title="Piezas para regalar" text="Joyería, relojes y lentes listos para entregar." />
    <div style={{ marginTop: 24 }}><Button>Ver regalos</Button></div>
  </div>
);
export const Ivory = () => <Section className="!py-12"><Body /></Section>;
export const Sunken = () => <Section tone="sunken" className="!py-12"><Body /></Section>;
export const Evergreen = () => <Section tone="evergreen" className="!py-12"><Body /></Section>;
