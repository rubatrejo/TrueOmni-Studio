import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { cache } from 'react';

import { DEFAULT_CLIENT_SLUG, getClientSlug } from './client-env';

/**
 * Configuración tipada de un cliente del kiosk.
 * Refleja `clients/_template/config.schema.json`. La validación runtime
 * llegará en Fase 5 (zod/valibot). En Fase 2 confiamos en el schema +
 * autocompletado del IDE.
 */
export interface KioskConfig {
  client: {
    slug: string;
    nombre: string;
    locale: string;
    timezone?: string;
  };
  branding: {
    logo: {
      default: string;
      dark?: string;
      alt: string;
    };
    favicon?: string;
  };
  textos: Record<string, string>;
  navegacion?: Record<string, string>;
  assets?: Record<string, string>;
  features?: {
    idioma_secundario?: boolean;
    mostrar_reloj?: boolean;
    inactividad_reset_seg?: number;
    permitir_compartir_qr?: boolean;
    /** Variante del Billboard idle (0-4). Default 0 si no se declara. */
    billboard_variant?: 0 | 1 | 2 | 3 | 4;
  };
  integraciones?: {
    api_base_url?: string;
    analytics_id?: string;
  };
  meta: {
    creado_en?: string;
    version_config: string;
  };
}

async function readConfig(slug: string): Promise<KioskConfig> {
  const filePath = path.join(process.cwd(), 'clients', slug, 'config.json');
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw) as KioskConfig;
}

/**
 * Carga la configuración del cliente activo (`KIOSK_CLIENT`).
 * Cacheada por render con `React.cache()` para que varios Server Components
 * compartan el resultado sin releer el fichero.
 * Fallback: si falla, cae a `clients/default/`.
 */
export const getConfig = cache(async (): Promise<KioskConfig> => {
  const slug = getClientSlug();
  try {
    return await readConfig(slug);
  } catch {
    if (slug !== DEFAULT_CLIENT_SLUG) {
      console.warn(
        `[kiosk] cliente "${slug}" no encontrado, usando "${DEFAULT_CLIENT_SLUG}" como fallback.`,
      );
      return readConfig(DEFAULT_CLIENT_SLUG);
    }
    throw new Error(`[kiosk] no se pudo cargar clients/${slug}/config.json`);
  }
});
