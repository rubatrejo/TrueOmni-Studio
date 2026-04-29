// Minimal _document para desactivar el fallback auto-generado por Next 15.
// El kiosk usa App Router (`src/app/layout.tsx`); este archivo solo existe
// para que Next no genere su propio _document que importa <Html> y rompe
// el SSG de /404 y /500.
//
// Si Pages Router queda habilitado en algún momento, este archivo es la
// base estándar.

import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
