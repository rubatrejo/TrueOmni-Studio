import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { StudioThemeProvider } from './_components/StudioThemeProvider';
import { ToastProvider } from './_components/Toast';
import { ViewerBanner } from './_components/ViewerBanner';

import './studio.css';

export const metadata: Metadata = {
  title: 'Kiosk Studio · TrueOmni',
  description: 'White-label kiosk management platform by TrueOmni.',
};

/**
 * Layout dedicado del Studio.
 *
 * Envuelve los children con `StudioThemeProvider`, que aplica la clase
 * `dark` al wrapper raíz para que las variantes `dark:` de Tailwind
 * respondan. La preferencia se persiste en localStorage.
 */
export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <StudioThemeProvider>
      <ToastProvider>
        <ViewerBanner />
        {children}
      </ToastProvider>
    </StudioThemeProvider>
  );
}
