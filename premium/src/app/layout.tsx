import type { ReactNode } from 'react';

// El <html> vive en app/[locale]/layout.tsx (necesita el idioma en `lang`).
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
