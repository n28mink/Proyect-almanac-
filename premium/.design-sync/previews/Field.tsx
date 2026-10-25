import { Field } from '@clover/ui';

export const Default = () => (
  <Field label="Nombre completo" id="name"><input id="name" className="h-12 w-full border border-line-strong bg-transparent px-4" placeholder="María Pérez" /></Field>
);
export const WithError = () => (
  <Field label="Teléfono" id="phone" error="Escribe un número de teléfono válido."><input id="phone" aria-describedby="phone-error" className="h-12 w-full border border-danger bg-transparent px-4" defaultValue="04" /></Field>
);
