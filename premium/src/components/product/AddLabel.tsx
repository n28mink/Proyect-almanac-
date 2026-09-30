'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckIcon } from '@/components/ui/Icon';

/** Estado «añadido» breve tras pulsar (feedback que muestra qué cambió, sin toast ni bloqueo). */
export function useAddedFlash(ms = 1600) {
  const [added, setAdded] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const flash = useCallback(() => {
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), ms);
  }, [ms]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [added, flash] as const;
}

/** Etiqueta de botón que cambia de estado: la nueva entra con fundido y un ligero desenfoque (`@starting-style`). */
export function AddLabel({ added, idle, done }: { added: boolean; idle: React.ReactNode; done: string }) {
  return added ? (
    <span key="done" className="morph-label inline-flex items-center gap-2">
      <CheckIcon width={16} height={16} aria-hidden="true" />
      {done}
    </span>
  ) : (
    <span key="idle" className="morph-label inline-flex items-center gap-2">
      {idle}
    </span>
  );
}
