import type { ReactNode } from 'react';

import { loadSignageTokensCss } from '@/lib/signage/config';

/**
 * Layout `/studio/digital-displays/...`.
 *
 * Inyecta el `tokens.css` del signage `default` para que las cards del
 * dashboard tengan acceso a las CSS vars `--signage-*` (gradient brand,
 * accent olive, etc.). En DSS1+ cuando haya branding per-theme se podrá
 * cargar el tokens del theme activo desde el editor.
 *
 * El bloque `<style>` se inyecta scoped al árbol del dashboard mediante el
 * selector `[data-signage-studio-scope]` para no contaminar el resto del
 * Studio si el usuario navega a otra ruta.
 */
export default async function DigitalDisplaysLayout({ children }: { children: ReactNode }) {
  const tokensCss = await loadSignageTokensCss('default').catch(() => '');
  // Scope los tokens al wrapper para evitar leak fuera del dashboard.
  const scopedCss = tokensCss
    ? tokensCss.replace(/:root\s*\{/g, '[data-signage-studio-scope] {')
    : '';

  return (
    <div data-signage-studio-scope>
      {scopedCss ? <style dangerouslySetInnerHTML={{ __html: scopedCss }} /> : null}
      {children}
    </div>
  );
}
