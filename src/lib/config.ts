import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { cache } from 'react';

import { DEFAULT_CLIENT_SLUG, getClientSlug } from './client-env';

/** Tile del grid del Home Dashboard, ordenado y configurable por cliente. */
export interface HomeTile {
  /** Identificador kebab-case: ruta = /home/{key}. */
  key: string;
  /** Label visual (cara externa). */
  label: string;
  /** Si false, la tile se oculta del grid pero la ruta sigue existiendo. */
  enabled: boolean;
  /** Path absoluto al asset de imagen (servido desde clients/{slug}/assets/). */
  image: string;
}

/** Ítem de búsqueda placeholder. Fases futuras lo reemplazan con data real. */
export interface HomeListing {
  slug: string;
  title: string;
  /** Referencia al `key` del tile al que pertenece. */
  category: string;
  image: string;
}

/** Horario de apertura por día (open, close) en horas 0-24. */
export type DayOpen = readonly [number, number];

/** Un listing completo del módulo de Listings (Restaurants / Things to Do / Stay). */
export interface Listing {
  slug: string;
  title: string;
  subcategory: string;
  image: string;
  /** Label de horas human-readable, ej. "7 am – 11 pm". */
  hours: string;
  /** Apertura por día para el filtro "Open now". Opcional. */
  openHours?: Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', DayOpen>;
  /** 1=$, 2=$$, 3=$$$, 4=$$$$. */
  priceRange: 1 | 2 | 3 | 4;
  /** Tags de features/servicios (WiFi, Parking, etc.). Subset de `module.features`. */
  features: string[];
  /** 0-100 — usado por el sort "Most Popular" (default, descending). */
  popularity: number;
  address: string;
  phone: string;
  coords: { lat: number; lng: number };
  website: string;
  reserveUrl?: string;
  threshold360Url?: string;
  description: string;
  /** Turn-by-turn mock para el Directions modal. */
  directions: { icon: string; distance: string; instruction: string }[];
}

/** Módulo de listings parametrizado por cliente (Restaurants, Things to Do, Stay). */
export interface HomeModule {
  /** Display name configurable por cliente ("Food & Drink", "Dine", etc.). */
  label: string;
  heroImage: string;
  /** Lista de subcategorías disponibles en este módulo. Se muestran en cards. */
  subcategories: string[];
  /** Features/servicios filtrables. */
  features: string[];
  listings: Listing[];
}

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
    /** Coordenadas para Open-Meteo weather. Default NY si se omite. */
    coords?: { lat: number; lng: number };
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
    /** Configuración del Main Dashboard / Home. */
    home?: {
      tiles: HomeTile[];
      wayfinding?: {
        enabled: boolean;
        label: string;
        image: string;
      };
      listings: HomeListing[];
      /** Módulos configurables (Restaurants, Things to Do, Stay, etc.). */
      modules?: Record<string, HomeModule>;
    };
  };
  integraciones?: {
    api_base_url?: string;
    analytics_id?: string;
    /** Token público de Mapbox para los mapas de listings. */
    mapbox_token?: string;
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
