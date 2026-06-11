import type { FeedProvider } from '@/lib/studio/client-content';
import { FEED_PROVIDERS } from '@/lib/studio/client-content';

import { crowdriffAdapter } from './adapters/crowdriff';
import { simpleviewAdapter } from './adapters/simpleview';
import { tempestAdapter } from './adapters/tempest';
import { wordpressAdapter } from './adapters/wordpress';
import type { FeedAdapter } from './types';

/**
 * Registro central de adaptadores de feed.
 *
 * Mapea cada `FeedProvider` (los 4 de `FEED_PROVIDERS`) a su `FeedAdapter`. El
 * pipeline de sync resuelve el adaptador con `getAdapter(connection.provider)`
 * sin conocer la implementación concreta.
 */

/** Record exhaustivo provider→adaptador (el tipo fuerza cubrir los 4). */
const ADAPTERS: Record<FeedProvider, FeedAdapter> = {
  simpleview: simpleviewAdapter,
  tempest: tempestAdapter,
  crowdriff: crowdriffAdapter,
  wordpress: wordpressAdapter,
};

/** Devuelve el adaptador de un proveedor. */
export function getAdapter(provider: FeedProvider): FeedAdapter {
  return ADAPTERS[provider];
}

/** Lista de proveedores soportados (mismo orden que `FEED_PROVIDERS`). */
export function listProviders(): readonly FeedProvider[] {
  return FEED_PROVIDERS;
}
