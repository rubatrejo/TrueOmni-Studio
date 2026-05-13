import type { ReactNode } from 'react';

import { loadSignageClient, loadSignageTokensCss } from '@/lib/signage/config';

/**
 * Layout del runtime video-walls. Nuke todos los chromes del Studio
 * (header, footer, padding) — la URL sirve a un TV físico, no a un
 * navegador con UI. Body inset-0 negro full-bleed.
 *
 * Inyecta tokens CSS del cliente (mismo patrón que el signage layout):
 *   1. `<style data-signage-tokens>` con `clients-signage/<client>/tokens.css`
 *      (base — los tokens del fs).
 *   2. `<style data-signage-token-overrides>` con `:root { --signage-X: V }`
 *      por cada entrada de `client.branding.tokens` del KV signage (overrides
 *      del editor — primary/secondary/accent del BrandingTab).
 *
 * Sin esto, los cambios de colores del editor NUNCA reflejan en el runtime
 * (el header del VW usa `hsl(var(--signage-header-bg))` y los templates SVG
 * usan los mismos tokens — ambos requieren el override del cliente activo).
 */
export default async function VideoWallLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ client: string; wall: string }>;
}) {
  const { client } = await params;

  let tokensCss = '';
  let overridesCss = '';
  try {
    tokensCss = await loadSignageTokensCss(client);
  } catch {
    // Si no se puede cargar tokens, el display sigue con :root defaults.
  }

  try {
    const clientCfg = await loadSignageClient(client);
    if (clientCfg?.branding.tokens) {
      const decls: string[] = [];
      for (const [k, v] of Object.entries(clientCfg.branding.tokens)) {
        decls.push(`--signage-${k}: ${v};`);
      }
      if (decls.length > 0) {
        overridesCss = `:root{${decls.join('')}}`;
      }
    }
  } catch {
    // No bloqueamos el render si falla el resolve.
  }

  return (
    <>
      {tokensCss ? (
        <style data-signage-tokens dangerouslySetInnerHTML={{ __html: tokensCss }} />
      ) : null}
      {overridesCss ? (
        <style data-signage-token-overrides dangerouslySetInnerHTML={{ __html: overridesCss }} />
      ) : null}
      <div className="fixed inset-0 overflow-hidden bg-black">{children}</div>
    </>
  );
}
