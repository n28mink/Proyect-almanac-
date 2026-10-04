import { WhatsAppIcon } from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

/**
 * Enlace a WhatsApp con icono. Sustituye al número de teléfono en el texto: el número no se muestra, pero el enlace
 * (wa.me) lo lleva. Se anuncia como «WhatsApp» y mide ≥ 44 px de alto como el resto de enlaces del pie.
 */
export function WhatsAppLink({ href, label = 'WhatsApp', className }: { href: string; label?: string; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn('inline-flex items-center gap-2', className)}>
      <WhatsAppIcon width={20} height={20} className="shrink-0" />
      {label}
    </a>
  );
}
