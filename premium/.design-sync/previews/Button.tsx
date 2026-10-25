import { Button } from '@clover/ui';

export const Solid = () => <Button>Agregar a la bolsa</Button>;
export const Outline = () => <Button variant="outline">Ver detalles</Button>;
export const Ghost = () => <Button variant="ghost" size="sm">Seguir comprando</Button>;
export const Link = () => <Button variant="link">Ver todos los relojes</Button>;
export const Disabled = () => <Button disabled>Sin stock</Button>;
export const Sizes = () => (
  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
    <Button size="sm">Pequeño</Button>
    <Button size="md">Mediano</Button>
    <Button size="lg">Grande</Button>
  </div>
);
