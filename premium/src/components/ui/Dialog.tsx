'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type DialogSide = 'right' | 'left' | 'top' | 'bottom' | 'center' | 'full';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  side?: DialogSide;
  /** Nombre accesible del diálogo. */
  label: string;
  className?: string;
  children: ReactNode;
  /** Renderiza el contenido solo mientras está abierto/animando (paneles pesados). */
  lazyContent?: boolean;
}

/**
 * Diálogo modal sobre <dialog> nativo: top layer, `inert` del resto de la página, foco atrapado y Escape gratis.
 * La animación de entrada/salida vive en CSS (data-visible); el cierre espera a que termine la transición.
 */
export function Dialog({ open, onClose, side = 'center', label, className, children, lazyContent = false }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open) {
      setMounted(true);
      if (!d.open) d.showModal();
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
    if (!d.open) return;
    const timer = window.setTimeout(() => {
      if (d.open) d.close();
      setMounted(false);
    }, 320);
    return () => clearTimeout(timer);
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={cn('dlg', className)}
      data-side={side}
      data-visible={visible}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {(!lazyContent || mounted || open) && children}
    </dialog>
  );
}
