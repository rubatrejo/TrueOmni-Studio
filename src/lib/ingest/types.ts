import type { FeedProvider } from '@/lib/studio/client-content';

/**
 * Tipos del pipeline de ingesta de feeds.
 *
 * Cada proveedor (Simple View, Tempest, Crowdriff, WordPress) implementa
 * `FeedAdapter`, que traduce su API a las formas crudas `RawListing`/`RawEvent`.
 * El normalizador (`normalize.ts`) las limpia y convierte a `ListingContentItem`
 * /`EventContentItem`; el merge (`merge.ts`) las funde con lo ya guardado.
 *
 * Las formas crudas son deliberadamente laxas (casi todo opcional, coords como
 * number|string) porque los feeds vienen "un desmadre"; la limpieza ocurre en
 * el normalizador, no aquí.
 */

export interface RawListing {
  /** ID estable del item en el proveedor. Requerido para el merge por ID. */
  providerId: string;
  title?: string;
  /** Categoría cruda del proveedor (se mapea a un módulo del kiosk). */
  category?: string;
  subcategory?: string;
  /** Puede traer HTML — el normalizador lo limpia. */
  description?: string;
  image?: string;
  images?: string[];
  address?: string;
  phone?: string;
  lat?: number | string;
  lng?: number | string;
  website?: string;
  hours?: string;
  priceLevel?: number | string;
  features?: string[];
}

export interface RawEvent {
  providerId: string;
  title?: string;
  category?: string;
  description?: string;
  image?: string;
  images?: string[];
  /** Cualquier formato razonable de fecha; el normalizador la lleva a ISO. */
  date?: string;
  startTime?: string;
  endTime?: string;
  venue?: string;
  address?: string;
  phone?: string;
  lat?: number | string;
  lng?: number | string;
  website?: string;
  priceMode?: string;
  features?: string[];
}

export interface RawFeedResult {
  listings: RawListing[];
  events: RawEvent[];
}

export interface FeedTestResult {
  ok: boolean;
  message?: string;
  /** Nº de items detectados en un fetch de prueba (si el adaptador lo reporta). */
  sampleCount?: number;
}

/** Config de conexión (credenciales/endpoint) tal cual la guarda el cliente. */
export type ProviderConfig = Record<string, string>;

/**
 * Contrato común de un adaptador de proveedor. `test` valida credenciales sin
 * importar; `fetch` trae todos los items crudos.
 */
export interface FeedAdapter {
  readonly provider: FeedProvider;
  test(config: ProviderConfig): Promise<FeedTestResult>;
  fetch(config: ProviderConfig): Promise<RawFeedResult>;
}
