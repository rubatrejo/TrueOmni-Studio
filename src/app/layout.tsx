import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { getClientTokensCss } from '@/lib/client-tokens';
import { getConfig } from '@/lib/config';

import '@/styles/globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const config = await getConfig();
  return {
    title: config.client.nombre,
    icons: config.branding.favicon ? [{ rel: 'icon', url: config.branding.favicon }] : undefined,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const [tokensCss, config] = await Promise.all([getClientTokensCss(), getConfig()]);

  return (
    <html lang={config.client.locale}>
      <head>
        {/* Tokens del cliente activo. Se inyectan antes de Tailwind base para
            que las variables estén disponibles al resolver las clases. */}
        <style data-kiosk-tokens dangerouslySetInnerHTML={{ __html: tokensCss }} />
      </head>
      <body className="bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
