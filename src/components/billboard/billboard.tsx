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

/**
 * Switcher de variante Billboard.
 * Lee `config.features.billboard_variant` (0-4) y renderiza la
 * variante correspondiente. Fallback a Billboard0 si el valor no
 * está definido o no coincide con un variante válido.
 */
export async function Billboard() {
  const config = await getConfig();
  const raw = config.features?.billboard_variant;
  const variant: BillboardVariant =
    typeof raw === 'number' && raw in VARIANTS ? (raw as BillboardVariant) : 0;
  const Component = VARIANTS[variant];
  return <Component />;
}
