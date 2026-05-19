import type { ReactNode } from 'react';

import { loadSignageClient, loadSignageTokensCss } from '@/lib/signage/config';

/**
 * Layout del runtime de un Digital Display.
 *
 * Inyecta los tokens del cliente signage (clients-signage/<client>/tokens.css)
 * como `<style data-signage-tokens>` en el árbol del display. Las variables
 * `--signage-*` se sobreponen a las del root layout sin colisión (los tokens
 * del kiosk usan prefijos diferentes).
 *
 * Después de los tokens base, emite un segundo bloque `<style data-signage-token-overrides>`
 * con los overrides puntuales de `branding.tokens` del client. Esto evita FOUC
 * cuando el operador edita tokens desde el Studio: el runtime SSR ya devuelve
 * el color correcto en el primer paint, sin esperar al bridge applier.
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
  let overridesCss = '';
  let fontsCss = '';
  try {
    tokensCss = await loadSignageTokensCss(client);
  } catch {
    // Si no se puede cargar tokens, el display sigue funcionando con las
    // variables :root del cliente "default" si existen. Layout no falla.
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

    // Custom fonts (display + body) — SSR-injected. Sin esto, el operador
    // sube un .ttf custom en el Studio Branding y el runtime standalone
    // del display NO lo aplicaba (solo el bridge editor lo hacía vía
    // SignageBridgeStyleApplier, que está dormido en standalone).
    // Fix 2026-05-18.
    const fonts = clientCfg?.branding.fonts;
    if (fonts) {
      const fontFaces: string[] = [];
      const rootDecls: string[] = [];
      const CSS_FORMAT: Record<string, string> = {
        woff2: 'woff2',
        woff: 'woff',
        ttf: 'truetype',
        otf: 'opentype',
      };
      if (fonts.displayCustom?.name && fonts.displayCustom?.dataUrl) {
        const fmt = CSS_FORMAT[fonts.displayCustom.format] ?? fonts.displayCustom.format;
        fontFaces.push(
          `@font-face{font-family:"${fonts.displayCustom.name}";src:url(${fonts.displayCustom.dataUrl}) format("${fmt}");font-display:swap;}`,
        );
        rootDecls.push(
          `--signage-font-display:"${fonts.displayCustom.name}",system-ui,sans-serif;`,
        );
      }
      if (fonts.bodyCustom?.name && fonts.bodyCustom?.dataUrl) {
        const fmt = CSS_FORMAT[fonts.bodyCustom.format] ?? fonts.bodyCustom.format;
        fontFaces.push(
          `@font-face{font-family:"${fonts.bodyCustom.name}";src:url(${fonts.bodyCustom.dataUrl}) format("${fmt}");font-display:swap;}`,
        );
        rootDecls.push(`--signage-font-body:"${fonts.bodyCustom.name}",system-ui,sans-serif;`);
      }
      if (fontFaces.length > 0) {
        fontsCss =
          fontFaces.join('') + (rootDecls.length > 0 ? `:root{${rootDecls.join('')}}` : '');
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
      {fontsCss ? (
        <style data-signage-fonts dangerouslySetInnerHTML={{ __html: fontsCss }} />
      ) : null}
      {children}
    </>
  );
}
