import { Dialog, Button } from '@clover/ui';

export const Center = () => (
  <Dialog open onClose={() => {}} label="Confirmar pedido" side="center">
    <div style={{ padding: 32, maxWidth: 440 }}>
      <h2 className="font-display text-display-m">¿Enviar tu pedido?</h2>
      <p className="mt-3 text-fg-muted">Te escribiremos por WhatsApp para confirmar el pago.</p>
      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}><Button>Enviar</Button><Button variant="outline">Cancelar</Button></div>
    </div>
  </Dialog>
);
