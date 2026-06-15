import { KioskCanvas } from '@/components/kiosk-canvas';
import { getConfig } from '@/lib/config';

import { Billboard0 } from './billboard-0';
import { Billboard1 } from './billboard-1';
import { Billboard2 } from './billboard-2';
import { Billboard3 } from './billboard-3';
import { Billboard4 } from './billboard-4';

const VARIANTS = {
  0: Billboard0,
  1: Billboard1,
  2: Billboard2,
  3: Billboard3,
  4: Billboard4,
} as const;

type BillboardVariant = keyof typeof VARIANTS;

interface BillboardProps {
  /** Override manual (URL `?variant=N` en dev). Si no llega, lee config. */
  variant?: number;
}

/**
 * Switcher de variante Billboard. El canvas 1080×1920 se wrappea aquí
 * para que el dev-nav (sibling) quede fuera del contexto de transform.
 * Prioridad:
 *   1. Prop `variant` (útil para navegación dev vía URL).
 *   2. `config.features.billboard_variant` (producción, por cliente).
 *   3. Fallback a Billboard0.
 */
export async function Billboard({ variant: override }: BillboardProps = {}) {
  const config = await getConfig();
  const raw = override ?? config.features?.billboard_variant;
  const variant: BillboardVariant =
    typeof raw === 'number' && raw in VARIANTS ? (raw as BillboardVariant) : 0;
  // Módulo Languages: si está desactivado, el idle oculta el selector de idioma
  // (y pone el "Powered by" en su lugar en las variantes 2/3/4). El valor real
  // del runtime vive en `features.languages.enabled`; el preview del Studio lo
  // sobreescribe en vivo vía evento.
  const languagesEnabled = config.features?.languages?.enabled ?? true;
  const Component = VARIANTS[variant];
  return (
    <KioskCanvas>
      <Component languagesEnabled={languagesEnabled} />
    </KioskCanvas>
  );
}
