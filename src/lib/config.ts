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

/** Intro del Survey mostrado en el primer paso. */
export interface SurveyIntro {
  title: string;
  subtitle?: string;
}

/** Pantalla de agradecimiento tras enviar el survey. */
export interface SurveyThankYou {
  title: string;
  message: string;
  /** Ms antes de cerrar el overlay. Default 5000. */
  autoCloseMs?: number;
}

/** Captura opcional de datos de contacto en un paso extra final. */
export interface SurveyContactCapture {
  enabled: boolean;
  email?: boolean;
  phone?: boolean;
  disclaimer: string;
}

/** Pregunta del survey — union discriminada por `type`. */
export type SurveyQuestion =
  | {
      id: string;
      type: 'nps';
      prompt: string;
      /** Subtítulo opcional debajo del prompt (máx. 2 líneas). */
      subtitle?: string;
      optional?: boolean;
      labels?: { low: string; high: string };
    }
  | {
      id: string;
      type: 'rating';
      prompt: string;
      subtitle?: string;
      optional?: boolean;
      /** Número máximo de estrellas (default 5). */
      max?: 5;
    }
  | {
      id: string;
      type: 'single-choice';
      prompt: string;
      subtitle?: string;
      optional?: boolean;
      options: string[];
    }
  | {
      id: string;
      type: 'multi-choice';
      prompt: string;
      subtitle?: string;
      optional?: boolean;
      options: string[];
    }
  | {
      id: string;
      type: 'text';
      prompt: string;
      subtitle?: string;
      optional?: boolean;
      /** Caracteres máximos del textarea (default 500). */
      maxLength?: number;
    };

/** Configuración completa del módulo Survey v1. */
export interface SurveyConfig {
  enabled: boolean;
  /** Logo opcional; si falta se usa `branding.logo.default` del cliente. */
  logo?: string;
  intro: SurveyIntro;
  questions: SurveyQuestion[];
  contactCapture?: SurveyContactCapture;
  thankYou: SurveyThankYou;
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
  /** Discriminador opcional (default = 'listings'). Events usa `kind: 'events'`. */
  kind?: 'listings';
  /** Display name configurable por cliente ("Food & Drink", "Dine", etc.). */
  label: string;
  heroImage: string;
  /** Lista de subcategorías disponibles en este módulo. Se muestran en cards. */
  subcategories: string[];
  /** Features/servicios filtrables. */
  features: string[];
  listings: Listing[];
}

/** Un evento del módulo Events (fecha + hora + venue). */
export interface EventItem {
  slug: string;
  title: string;
  /** Una de `HomeEventsModule.categories` (ej. 'Music', 'Sports'). */
  category: string;
  image: string;
  /** Fecha ISO local 'YYYY-MM-DD'. */
  date: string;
  /** Hora inicio 'HH:MM' (24h local). */
  startTime: string;
  /** Hora fin 'HH:MM' (24h local). */
  endTime: string;
  /** Una de `HomeEventsModule.venues`. */
  venue: string;
  /** `'free'` o `'paid'` — combinado con `priceBand` si paid. */
  priceMode: 'free' | 'paid';
  priceBand?: 1 | 2 | 3 | 4;
  /** Tags filtrables (subset de `module.features`). */
  features: string[];
  popularity: number;
  address: string;
  phone: string;
  coords: { lat: number; lng: number };
  website: string;
  /** Si existe, renderiza botón "GET TICKETS" en el detail. */
  ticketsUrl?: string;
  description: string;
  directions: { icon: string; distance: string; instruction: string }[];
  /** Si está presente, el evento vende boletos y aparece en el módulo Tickets. */
  ticket?: {
    /** Texto libre a mostrar en la card/detail: "$25", "$15–30", "From $10". */
    priceDisplay: string;
    /** URL absoluta que va codificada en el QR del popup de compra. */
    purchaseUrl: string;
  };
}

/** Módulo de Events (calendario + lista por día + detail). */
export interface HomeEventsModule {
  kind: 'events';
  label: string;
  heroImage: string;
  /** Categorías del filtro Category (OR). */
  categories: string[];
  /** Lugares del filtro Venue (OR). */
  venues: string[];
  /** Features/tags del filtro Features (AND). */
  features: string[];
  events: EventItem[];
}

/** Red social soportada por el módulo Social Wall. */
export type SocialSource = 'x' | 'instagram' | 'pinterest' | 'youtube' | 'facebook' | 'tiktok';

/** Tipo de post del Social Wall. */
export type SocialPostType = 'image' | 'video' | 'text' | 'gallery';

export interface SocialAuthor {
  /** Nombre visible del autor. Ej. "Anne Smith". */
  name: string;
  /** Handle sin arroba. Ej. "annesmith". */
  username: string;
  /** URL del avatar (cuadrado recomendado). */
  avatar: string;
}

export interface SocialPost {
  id: string;
  source: SocialSource;
  type: SocialPostType;
  author: SocialAuthor;
  /** ISO 'YYYY-MM-DDTHH:MM:SSZ' o 'YYYY-MM-DD HH:MM'. */
  publishedAt: string;
  /** Puede ir vacía para type='image' sin caption visible. */
  caption: string;
  /** URL del media principal (image o video). */
  mediaUrl?: string;
  /** Poster/thumbnail usado en la card para type='video'. */
  videoPoster?: string;
  /** Solo type='gallery'. */
  galleryUrls?: string[];
  /** Ratio width/height del media. Default 1. Usado para el masonry. */
  aspectRatio?: number;
  /** Link externo al post original. No se abre en el kiosk. */
  permalink?: string;
}

export interface SocialHighlight {
  id: string;
  /** Imagen cuadrada para el círculo (logo o foto). */
  image: string;
  /** Label opcional. */
  label?: string;
}

export interface HomeSocialWallModule {
  kind: 'social-wall';
  label: string;
  heroImage: string;
  /** Hashtag sin '#' — la UI añade el prefijo. */
  hashtag: string;
  /** Handles públicos por red. Las keys presentes activan sus tabs. */
  handles?: Partial<Record<SocialSource, string>>;
  highlights: SocialHighlight[];
  posts: SocialPost[];
}

export interface BrochureItem {
  slug: string;
  title: string;
  /** Una de `HomeDigitalBrochureModule.categories`. */
  category: string;
  /** URL del cover (JPG/PNG). */
  cover: string;
  description: string;
  /** "June, 2025" — human-readable. */
  publishedLabel: string;
  /** URL al PDF (mismo origin o con CORS habilitado). */
  pdfUrl: string;
  /** Número de páginas (para el scrubber `N/total` sin esperar al fetch). */
  pageCount: number;
}

export interface HomeDigitalBrochureModule {
  kind: 'digital-brochure';
  label: string;
  heroImage: string;
  /** Tabs del listado. Implícitamente se añade "Select all" al inicio. */
  categories: string[];
  brochures: BrochureItem[];
}

/** Keys lógicas del chip de categoría del Map. */
export type MapSource = 'restaurants' | 'things-to-do' | 'stay' | 'events';

/** Módulo Map: agrega listings + events de los otros módulos del cliente. */
export interface HomeMapModule {
  kind: 'map';
  label: string;
  heroImage?: string;
  /** Copy del welcome popup (overlay inicial). Si se omite no se muestra. */
  welcomeCopy?: {
    title: string;
    subtitle?: string;
    body: string;
    cta: string;
  };
  /** Labels de los chips de categoría. Si se omiten se usa el default en inglés. */
  chips?: {
    play?: string;
    eat?: string;
    stay?: string;
    events?: string;
  };
  /** Overrides de keys de módulos origen cuando un cliente no usa las keys estándar. */
  sources?: {
    play?: string;
    eat?: string;
    stay?: string;
    events?: string;
  };
  defaultZoom?: number;
  defaultCenter?: { lat: number; lng: number };
  /** Ventana de eventos a mostrar (default 7 días desde hoy). */
  eventsWindowDays?: number;
}

/** Actividad incluida en un pass — display-only (title + image + desc + website). */
export interface PassActivity {
  slug: string;
  title: string;
  /** Path relativo o URL absoluta del thumbnail. */
  image: string;
  description: string;
  /** Link externo que se abre al tap "View Website". */
  website: string;
}

/** Pass individual — paquete de actividades regalable/comprable. */
export interface PassItem {
  slug: string;
  title: string;
  /** Cover del pass — path relativo a clients/{slug}/assets/ o URL absoluta. */
  cover: string;
  /** URL al pass en Bandwango. Codificado en el QR del share. */
  bandwangoUrl: string;
  /** Tagline corto opcional para la card y el hero del detail. */
  tagline?: string;
  activities: PassActivity[];
}

/** Módulo Passes — kind discriminator 'passes'. */
export interface HomePassesModule {
  kind: 'passes';
  label: string;
  heroImage: string;
  passes: PassItem[];
  /** Logo centrado en el QR del share modal (path relativo o URL). Si se omite, el QR no lleva logo. */
  qrLogo?: string;
}

/** Módulo Tickets — kind discriminator 'tickets'. Vista filtrada sobre events ticketables. */
export interface HomeTicketsModule {
  kind: 'tickets';
  label: string;
  heroImage: string;
  /** Opcionales — si faltan, el filter overlay deriva del pool visible. */
  categories?: string[];
  venues?: string[];
  features?: string[];
}

/** Cupón/descuento mostrado en el módulo Deals. */
export interface Deal {
  slug: string;
  /** Ej. "10% off Zara". */
  title: string;
  /** Texto breve de la card (~2 líneas). */
  shortDescription: string;
  /** Headline del modal redeem. Ej. "You're In Luck, 10% Coupons Are Back!". */
  headline: string;
  /** Subtitle del modal. Ej. "Exclusive Offer for Fashion Lovers!". */
  subtitle: string;
  /** Cuerpo del modal. Puede mencionar el `promoCode` en texto. */
  longDescription: string;
  /** Path relativo a `clients/{slug}/assets/` o URL absoluta. */
  cover: string;
  /** ISO 'YYYY-MM-DD'. Deals con `expiresAt < today` se auto-filtran. */
  expiresAt: string;
  /** Precio tachado visible en la card. Opcional. */
  originalPrice?: string;
  /** Código canjeable mostrado en el modal. Opcional. Ej. "ZARA10". */
  promoCode?: string;
  /** URL codificada en el QR del modal redeem. */
  qrUrl: string;
  /** Tags filtrables (subset de `HomeDealsModule.featureCatalog`). */
  features: string[];
  /** 0-100 — tiebreaker del sort. Opcional. */
  popularity?: number;
  /** Porcentaje de descuento (0-100) — usado por el sort "best-discount". */
  discountValue?: number;
}

/** Módulo Deals — kind discriminator 'deals'. Grid de cupones con modal redeem. */
export interface HomeDealsModule {
  kind: 'deals';
  label: string;
  heroImage: string;
  /** Catálogo de features visible en el filter overlay. */
  featureCatalog: string[];
  deals: Deal[];
  /** Logo opcional centrado en el QR (mismo comportamiento que Passes). */
  qrLogo?: string;
}

/** Nivel de dificultad de un trail. */
export type TrailDifficulty = 'Easy' | 'Moderate' | 'Hard';

/** Forma topológica del trail. */
export type TrailType = 'Loop' | 'Out & Back' | 'Point to Point';

/** Información estructurada de un trail mostrada en el panel "Considerations". */
export interface TrailConsiderations {
  /** Ej. "5.2 mi" (texto libre, el cliente elige unidades). */
  distance: string;
  difficulty: TrailDifficulty;
  /** Ej. "2-3 hours" (texto libre). Opcional. */
  duration?: string;
  /** Ej. "1,280 ft" o "390 m". Opcional. */
  elevationGain?: string;
  trailType?: TrailType;
  /** Si true muestra el indicador "Dog Friendly". Ausente = desconocido. */
  dogFriendly?: boolean;
}

/** Un trail del módulo Trails. Extiende la idea de Listing con considerations + trailMap. */
export interface Trail {
  slug: string;
  title: string;
  /** Ej. "Mountain", "Desert", "Canyon". Se muestra en el header del detail. */
  subcategory: string;
  image: string;
  /** Horario human-readable. Ej. "Sunrise – Sunset". */
  hours: string;
  /** Subset de `HomeTrailsModule.features` (AND en filter). */
  features: string[];
  popularity: number;
  /** Dirección del trailhead. */
  address: string;
  /** Contacto del parque / trailhead info. */
  phone: string;
  coords: { lat: number; lng: number };
  website: string;
  description: string;
  /** Turn-by-turn mock para el Directions modal. */
  directions: { icon: string; distance: string; instruction: string }[];
  considerations: TrailConsiderations;
  /** GeoJSON del recorrido + hints para el tab "Trail Map". */
  trailMap: {
    geojson: { type: 'LineString'; coordinates: [number, number][] };
    defaultCenter?: { lat: number; lng: number };
    defaultZoom?: number;
  };
}

/** Una opción del catálogo de pins que el usuario puede arrastrar al mapa. */
export interface GuestbookPinOption {
  id: string;
  /** Path relativo a `clients/{slug}/assets/` o URL absoluta. Imagen del pin completo (círculo + pointer). */
  image: string;
  /** Imagen del círculo solo (sin pointer) — usado dentro del popup de comentarios para que el avatar coincida con el pin del mapa. */
  circleImage?: string;
  label: string;
}

/** País preset para el dropdown del form Guestbook. */
export interface GuestbookCountry {
  /** Código ISO 3166-1 alpha-2 (ej. "US", "MX"). Usado por Mapbox geocoding. */
  code: string;
  name: string;
}

/** Pin seed de otro "usuario" que el operador configura en el cliente. */
export interface GuestbookSeedPin {
  id: string;
  authorName: string;
  zipCode: string;
  coords: { lat: number; lng: number };
  /** Path/URL del avatar que se dibuja en el mapa. */
  pinImage: string;
  /** Ej. "Today", "Yesterday", "Jan 14". */
  dateLabel: string;
  /** Dirección legible mostrada en el popup del pin. */
  address: string;
  comment?: string;
}

/** Módulo Guestbook — kind discriminator 'guestbook'. */
export interface HomeGuestbookModule {
  kind: 'guestbook';
  label: string;
  /** Imagen del hero superior de la pantalla Start (ej. ballerinas). */
  heroImage: string;
  /** 5 pins arrastrables que el usuario puede elegir. */
  pinCatalog: GuestbookPinOption[];
  /** Países preset del dropdown del form. */
  countries: GuestbookCountry[];
  /** Pins seed de otros "usuarios" que se muestran en el mapa. */
  seedPins: GuestbookSeedPin[];
  /** Center + zoom inicial del globo (phases start/form). Default world-view. */
  earthStart?: { center: { lat: number; lng: number }; zoom: number };
}

/** Módulo Trails — kind discriminator 'trails'. */
export interface HomeTrailsModule {
  kind: 'trails';
  label: string;
  heroImage: string;
  /** Subcategorías del pool (ej. "Mountain", "Desert"). Usadas como chips opcionales. */
  subcategories: string[];
  /** Catálogo de features AND del filter. */
  features: string[];
  /** Difficulties OR del filter (subset de TrailDifficulty). */
  difficulties: TrailDifficulty[];
  /** Trail types OR del filter (subset de TrailType). */
  trailTypes: TrailType[];
  trails: Trail[];
}

/** Unión discriminada de los variants de módulo. */
export type HomeModuleVariant =
  | HomeModule
  | HomeEventsModule
  | HomeSocialWallModule
  | HomeDigitalBrochureModule
  | HomeMapModule
  | HomePassesModule
  | HomeTicketsModule
  | HomeDealsModule
  | HomeTrailsModule
  | HomeGuestbookModule;

/**
 * Publicidad declarativa por cliente (Fase 3.8). El kiosk renderiza ads
 * según la ruta actual; el cliente declara el catálogo y asigna rutas.
 *
 * 3 tipos:
 *   - `popup`  → modal bloqueante centrado (ej. flyer con QR).
 *   - `hero`   → cubre los 620px del hero header (ej. ad landscape).
 *   - `bottom` → strip horizontal pegado al bottom del canvas.
 */
export type AdKind = 'popup' | 'hero' | 'bottom';

/** Tono del fondo de la imagen del ad — determina el color del botón X.
 *  `dark` (default) → X blanca con sombra oscura.
 *  `light`          → X negra con sombra clara. */
export type AdTheme = 'dark' | 'light';

export interface Ad {
  id: string;
  kind: AdKind;
  /** Path/URL de la imagen (el QR ya viene dentro del asset, sin X). */
  image: string;
  alt?: string;
  /** Rutas donde aplica. Paths exactos (`/home/restaurants`) o wildcards
   *  con `/*` al final (`/home/restaurants/*`). Sin rutas = nunca se muestra. */
  routes: string[];
  /** Si false oculta el ad sin borrarlo. Default true. */
  enabled?: boolean;
  /** Tono del fondo para decidir el color del botón X. Default `dark`. */
  theme?: AdTheme;
}

export interface AdvertisementsConfig {
  ads: Ad[];
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
      survey?: SurveyConfig;
      listings: HomeListing[];
      /** Módulos configurables (Listings o Events). Discriminados por `kind`. */
      modules?: Record<string, HomeModuleVariant>;
    };
    /** Catálogo de ads declarativo (Fase 3.8). */
    advertisements?: AdvertisementsConfig;
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
