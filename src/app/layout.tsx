import type { Metadata } from 'next';
import { Montserrat, Noto_Sans_JP, Open_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

import { getClientTokensCss } from '@/lib/client-tokens';
import { getConfig } from '@/lib/config';

import '@/styles/globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-montserrat',
  display: 'swap',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-open-sans',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-jp',
  display: 'swap',
});

// El kiosk lee config en runtime (filesystem por KIOSK_CLIENT). Marcar el
// layout como dynamic evita que Next intente prerender /404 con un getConfig
// que no tiene client válido en build, lo que arrastraba el error de
// `<Html> outside pages/_document`.
export const dynamic = 'force-dynamic';

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
    <html
      lang={config.client.locale}
      className={`${montserrat.variable} ${openSans.variable} ${notoSansJP.variable}`}
    >
      <head>
        {/* Tokens del cliente activo. Se inyectan antes de Tailwind base para
            que las variables estén disponibles al resolver las clases. */}
        <style data-kiosk-tokens dangerouslySetInnerHTML={{ __html: tokensCss }} />
      </head>
      <body className="bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
