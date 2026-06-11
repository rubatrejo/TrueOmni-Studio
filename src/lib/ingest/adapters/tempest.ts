import type { FeedAdapter, FeedTestResult, ProviderConfig, RawEvent } from '../types';

import { fetchSimpleviewJson, parseSimpleviewEvents, parseSimpleviewListings } from './simpleview';

/**
 * Adaptador de Tempest (plataforma DMS de Simpleview, antes "Tempest
 * Interactive Media"). Comparte linaje y shape de datos con Simpleview, así que
 * REUSA su parser defensivo en lugar de duplicarlo — los mismos alias de campos
 * cubren ambos feeds.
 *
 * IMPORTANTE: el mapeo exacto de campos depende de la cuenta/feed real del
 * cliente; estos alias cubren los shapes comunes de Simpleview/Tempest y deben
 * confirmarse contra credenciales reales (riesgo documentado en el plan).
 *
 * Config esperada (igual que Simpleview):
 * - `endpoint` (requerido) — URL completa del feed de listings.
 * - `apiKey`   (opcional)  — credencial de la cuenta.
 * - `eventsEndpoint` (opcional) — URL del feed de eventos, si es distinta.
 */

export const tempestAdapter: FeedAdapter = {
  provider: 'tempest',

  async test(config: ProviderConfig): Promise<FeedTestResult> {
    const endpoint = config.endpoint?.trim();
    if (!endpoint) {
      return { ok: false, message: 'Falta "endpoint" en la configuración del feed de Tempest.' };
    }
    try {
      const json = await fetchSimpleviewJson(endpoint, config.apiKey?.trim());
      const listings = parseSimpleviewListings(json);
      return {
        ok: true,
        message: `Conexión correcta con el feed de Tempest (${listings.length} listings detectados).`,
        sampleCount: listings.length,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      return { ok: false, message: `No se pudo conectar con Tempest: ${message}` };
    }
  },

  async fetch(config: ProviderConfig) {
    const endpoint = config.endpoint?.trim();
    if (!endpoint) {
      throw new Error('Falta "endpoint" en la configuración del feed de Tempest.');
    }
    const apiKey = config.apiKey?.trim();
    const eventsEndpoint = config.eventsEndpoint?.trim();

    const listingsJson = await fetchSimpleviewJson(endpoint, apiKey);
    const listings = parseSimpleviewListings(listingsJson);

    let events: RawEvent[] = [];
    if (eventsEndpoint) {
      const eventsJson = await fetchSimpleviewJson(eventsEndpoint, apiKey);
      events = parseSimpleviewEvents(eventsJson);
    }

    return { listings, events };
  },
};
