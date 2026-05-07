import type { ReactNode } from 'react';

import { loadSignageTokensCss } from '@/lib/signage/config';

/**
 * Layout del runtime de un Digital Display.
 *
 * Inyecta los tokens del cliente signage (clients-signage/<client>/tokens.css)
 * como `<style data-signage-tokens>` en el árbol del display. Las variables
 * `--signage-*` se sobreponen a las del root layout sin colisión (los tokens
 * del kiosk usan prefijos diferentes).
 *
 * NO incluye providers de idle / keyboard del kiosk: signage es view-only.
 */
export default async function SignageDisplayLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ client: string; display: string }>;
}) {
  const { client } = await params;
  let tokensCss = '';
  try {
    tokensCss = await loadSignageTokensCss(client);
  } catch {
    // Si no se puede cargar tokens, el display sigue funcionando con las
    // variables :root del cliente "default" si existen. Layout no falla.
  }

  return (
    <>
      {tokensCss ? (
        <style data-signage-tokens dangerouslySetInnerHTML={{ __html: tokensCss }} />
      ) : null}
      {children}
    </>
  );
}
