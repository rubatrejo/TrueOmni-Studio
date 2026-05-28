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

/** Pregunta sugerida del módulo Ask AI con su respuesta mock (typewriter). */
export interface AskAiSuggestedQuestion {
  id: string;
  text: string;
  response: string;
}

/**
 * Configuración del módulo Ask AI (Fase 3.15).
 * Avatar IA flotante en el Home que abre un modal con suggested questions,
 * input + on-screen keyboard y mic con Web Speech API. v1 usa respuestas
 * mock (typewriter); v2 conectará a un endpoint real (`/api/ai`).
 */
export interface AskAiConfig {
  enabled: boolean;
  /** Path relativo del PNG/JPG del avatar (servido desde `/assets/...`). */
  avatar: string;
  /** Path relativo del MP4/WebM del hero del modal (loop). */
  heroVideo: string;
  /** Texto de bienvenida que se muestra al abrir el modal (sin typewriter). */
  greeting: string;
  /** Subtítulo bajo el título "Ask AI" en el hero del modal. */
  subtitle?: string;
  /** Chips horizontales con la respuesta typewriter asociada a cada uno. */
  suggestedQuestions: AskAiSuggestedQuestion[];
  /** Posición del trigger flotante en el Home.
   *  - `size` (default 82) → trigger cuadrado/circular.
   *  - `width` + `height` → trigger rectangular (ej. pastilla con texto y/o icono).
   *  Si se declaran ambos, `width`/`height` ganan a `size`. */
  position?: {
    right?: number;
    bottom?: number;
    size?: number;
    width?: number;
    height?: number;
  };
}

/** Background 1080×1920 subido por el cliente. Usado como fondo green-screen.
 *  Caso especial: id "none" + image vacío → no se reemplaza el fondo, se usa
 *  la foto original capturada por la cámara. */
export interface PhotoBoothBackground {
  id: string;
  /** Path relativo o URL absoluta. Vacío = sin reemplazo (usa foto original). */
  image: string;
  /** Label visible en el carrusel. */
  label: string;
  /** Thumbnail opcional para el círculo del carrusel; si se omite se usa `image`. */
  thumbnail?: string;
}

/** Frame PNG transparente 1080×1920 que va por encima de la foto compuesta. */
export interface PhotoBoothFrame {
  id: string;
  image: string;
  label: string;
  thumbnail?: string;
}

/** Filtro CSS aplicado a la foto en el editor y cocido en el canvas final. */
export interface PhotoBoothFilter {
  id: string;
  /** Label visible en el carrusel. */
  label: string;
  /** Valor de `ctx.filter` / `style.filter` — ej. "grayscale(1)", "saturate(1.3) contrast(1.1)". */
  cssFilter: string;
  /** Thumbnail opcional (imagen con el filtro ya aplicado para el preview). */
  thumbnail?: string;
}

/** Sticker PNG que el usuario añade tapeando y reposiciona arrastrando. */
export interface PhotoBoothSticker {
  id: string;
  /** Path del PNG con transparencia. */
  image: string;
  /** Label aria-label + hover. */
  label: string;
  /** Ancho por defecto al añadir (px, sistema de coordenadas 1080×1920). */
  defaultWidth?: number;
}

/** Timer configurable antes de disparar. */
export interface PhotoBoothTimerConfig {
  /** Si false, oculta el toggle y dispara inmediatamente. */
  enabled: boolean;
  /** Segundos seleccionados por defecto (debe estar en `options`). */
  default: number;
  /** Opciones disponibles (3s, 5s, 10s típicamente). */
  options: number[];
}

/**
 * Configuración del módulo Photo Booth (Fase 3.16).
 * Captura con cámara del kiosk, reemplazo de fondo estilo green-screen con
 * MediaPipe SelfieSegmenter, editor con backgrounds/frames/filtros/stickers y
 * share mock (QR + email + text — backend real en Fase 5+).
 */
export interface PhotoBoothConfig {
  enabled: boolean;
  /** Backgrounds para el reemplazo green-screen. Al menos 1 requerido. */
  backgrounds: PhotoBoothBackground[];
  /** Frames overlay. Vacío = no hay tab Frames. */
  frames: PhotoBoothFrame[];
  /** Filtros CSS. Vacío = no hay tab Filters. */
  filters: PhotoBoothFilter[];
  /** Stickers posicionables. Vacío = no se muestra la fila. */
  stickers: PhotoBoothSticker[];
  /** Config del timer; si se omite timer=10s por defecto con opciones [3,5,10]. */
  timer?: PhotoBoothTimerConfig;
  /** URL template para el QR de share. Sustituye `{id}` por UUID client-side.
   *  Ej. "https://share.arizona.com/{id}". v1 es placeholder; Fase 5+ conecta backend. */
  shareUrlTemplate?: string;
  /** Handles sociales mostrados en la pantalla de Share (Follow us). */
  social?: {
    x?: string;
    facebook?: string;
    instagram?: string;
  };
  /** Branding dentro de la tarjeta de la foto final. Default = logo del cliente. */
  shareCardLogo?: string;
  /** Imagen de fondo de la pantalla Share (fullscreen 1080×1920). El cliente
   *  la sube desde el CMS en producción; v1 usa un seed estático. */
  shareBackground?: string;
  /** Feather del mask alpha (px) para suavizar bordes del cutout. Default 3. */
  edgeFeather?: number;
  /** Zoom default de la cámara. 1.0 = sin zoom. <1 alejado (más gente cabe,
   *  requiere webcam wide-angle/PTZ que soporte el constraint), >1 acerca
   *  (digital zoom-in vía CSS transform). Default 1. */
  cameraZoom?: number;
}

/** Categoría posible de un stop dentro de un itinerario (mapea al bucket de favoritos). */
export type ItineraryStopKind = 'listing' | 'event' | 'trail';

/** Stop concreto dentro de un Local Listing pre-armado o de un itinerario AI generado. */
export interface ItineraryStopRef {
  /** Slug del listing/evento/trail referenciado dentro de su módulo origen. */
  slug: string;
  /** Discriminador del bucket donde vive (`useFavorites`, `useEventFavorites`, `useTrailFavorites`). */
  kind: ItineraryStopKind;
  /** Key del módulo del cliente donde vive el item (ej. "restaurants", "things-to-do", "events", "trails"). */
  moduleSlug: string;
}

/** Itinerario pre-armado curado por el cliente desde el CMS (tab "Local Listings"). */
export interface LocalListingItinerary {
  slug: string;
  title: string;
  /** Cuerpo descriptivo mostrado en el preview. */
  description: string;
  /** Cover de la card y del preview (path relativo a `clients/{slug}/assets/` o URL absoluta). */
  image: string;
  stops: ItineraryStopRef[];
}

/** Opción de una pregunta del wizard AI. `days` solo aplica a la pregunta `duration`. */
export interface AiQuestionOption {
  value: string;
  label: string;
  /** Solo en la pregunta `duration`: número de días que genera el resultado.
   *  0 = lista corta sin tabs DAY, 1 = un día, 3 = tres días. */
  days?: number;
  /** Categoría del kiosk a filtrar cuando esta option es elegida (e.g.
   *  'restaurants', 'things-to-do', 'trails'). El generador AI usa esto
   *  para limitar el resultado al módulo específico. */
  category_key?: string;
  /** Subcategoría dentro del categoryKey (e.g. 'Hiking', 'Mexican'). */
  subcategory_key?: string;
}

/** Pregunta del wizard AI — schema config-driven (Fase 3.17). */
export interface AiQuestion {
  /** Identificador estable (ej. `duration`, `travel_type`, `activities`, `dining`). */
  key: string;
  /** Kicker azul encima del título (ej. "Duration"). */
  kicker: string;
  /** Título principal de la pregunta. Soporta `{client_name}`. */
  title: string;
  /** Subtítulo opcional debajo del título (ej. "*Select all that apply"). */
  subtitle?: string;
  /** Single-choice (radio) o multi-choice (checkbox). */
  type: 'single' | 'multi';
  /** Hero image arriba de la pregunta (path relativo o URL). */
  hero_image: string;
  options: AiQuestionOption[];
}

/** Configuración del subsistema AI Itinerary del módulo. */
export interface ItineraryAiConfig {
  /**
   * Si false, el botón "AI Itinerary" del welcome popup se oculta y los
   * visitantes solo pueden construir el itinerario manualmente.
   * El módulo Trip Planner sigue activo (controlado por el flag global
   * `enabled` del bloque itinerary, no por este). Default true.
   */
  enabled?: boolean;
  /** Lista ordenada de preguntas que pasan por el wizard. */
  questions: AiQuestion[];
  /** Background fullscreen del loading screen mientras se "genera" el itinerario. */
  loading_image: string;
  /** Plantilla del título del Final Result. Soporta `{client_name}` y `{duration_label}`. */
  default_title_template?: string;
}

/**
 * Configuración del módulo Trip Builder (Fase 3.17).
 * Recolecta los listings/events/trails que el usuario marcó con like en otros módulos
 * y permite construir un día con stops sobre un mapa interactivo, con un flujo AI
 * opcional que genera el itinerario completo a partir de 4 preguntas.
 */
export interface ItineraryConfig {
  enabled: boolean;
  /** Si true, el welcome popup aparece SIEMPRE al entrar al módulo (útil mientras está
   *  en review/ajustes). Si false, persiste con sessionStorage `kiosk_itinerary_welcomed`. */
  welcome_always_visible?: boolean;
  /** Estado inicial del toggle "Show Driving" en la map toolbar. Default true. */
  show_driving_default?: boolean;
  /** Estado inicial del toggle "Hide Markers" en la map toolbar. Default false. */
  hide_markers_default?: boolean;
  /** Tope duro de stops en el rail manual. Default 12. */
  max_stops?: number;
  /** Itinerarios pre-armados curados por el cliente. Si está vacío no se muestra el tab. */
  local_listings: LocalListingItinerary[];
  ai: ItineraryAiConfig;
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

// MapSource types live in @/lib/map-source so Client Components can import
// them without pulling `server-only` dependencies from this file.
export {
  CANONICAL_MAP_SOURCES,
  isCanonicalMapSource,
  type CanonicalMapSource,
  type MapSource,
} from './map-source';

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
    trails?: string;
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
 * Configuración multi-idioma del cliente. Las traducciones viven en
 * `clients/{slug}/i18n/{locale}.json` (uno por idioma, mismo schema flat).
 * El idioma activo se persiste en sessionStorage; default es `default`.
 */
export interface LanguagesConfig {
  enabled: boolean;
  available: string[];
  default: string;
}

/** Pantalla Welcome (splash de arranque) de la PWA Mobile. */
export interface PwaWelcomeConfig {
  /** Imagen de fondo fullscreen (path relativo a `assets/` o URL absoluta). */
  background: string;
  /** Logo override; si se omite usa `branding.idleLogo` → `branding.logo.default`. */
  logo?: string;
  /** Ms antes de auto-avanzar a Login. Default 2500. */
  autoAdvanceMs?: number;
}

/** Textos de la pantalla Login de la PWA (white-label, sin hardcodear en JSX). */
export interface PwaLoginConfig {
  /** Imagen de fondo; si se omite reutiliza `welcome.background`. */
  background?: string;
  loginWith: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  forgotPassword: string;
  loginCta: string;
  createAccountCta: string;
  skipLogin: string;
}

/** Acceso rápido (squircle) de la fila superior del Dashboard PWA. */
export interface PwaQuickAccess {
  /** Identificador kebab-case (ruta destino futura). */
  key: string;
  label: string;
  /** Imagen del thumbnail (path relativo a `assets/` o URL). */
  image: string;
}

/** Tile del grid del Dashboard PWA. */
export interface PwaTile {
  /** Identificador kebab-case (ruta = módulo destino). */
  key: string;
  label: string;
  /** Imagen de fondo del tile. */
  image: string;
  /** Si true, ocupa el ancho completo del grid (1 columna span 2). */
  wide?: boolean;
}

/** Pantalla Home/Dashboard de la PWA. */
export interface PwaDashboardConfig {
  /** Título del hero (soporta varias líneas). */
  heroTitle: string;
  /** Imagen del hero banner. */
  heroImage: string;
  /** Fila de accesos rápidos (squircles). */
  quickAccess: PwaQuickAccess[];
  /** Tiles del grid principal. */
  tiles: PwaTile[];
}

/** Ítem de la lista del More Menu. */
export interface PwaMoreItem {
  /** Identificador kebab-case (ruta destino futura). */
  key: string;
  label: string;
}

/** Pantalla More Menu de la PWA. */
export interface PwaMoreConfig {
  /** Placeholder de la barra de búsqueda. */
  searchPlaceholder: string;
  /** Texto de ubicación + clima de la banda olive (placeholder; clima vía integración). */
  weatherText: string;
  /** Lista de accesos del menú. */
  items: PwaMoreItem[];
}

/** Handles sociales de la pantalla Connect With Us (solo se pinta el icono si hay URL). */
export interface PwaConnectSocial {
  x?: string;
  facebook?: string;
  instagram?: string;
  pinterest?: string;
}

/** Un día del horario mostrado en el modal de Connect With Us. */
export interface PwaConnectHoursDay {
  /** Etiqueta del día (ya localizada en el config). Ej. "Monday". */
  day: string;
  /** Rango de apertura, o `null`/omitido si está cerrado ese día. */
  open?: string;
  close?: string;
  /** Si true, se muestra como "Closed" ignorando open/close. */
  closed?: boolean;
}

/** Horario de la pantalla Connect With Us. */
export interface PwaConnectHours {
  /** Texto de la barra (soporta `{close}`). Ej. "Open Now until {close}". */
  statusTemplate: string;
  /** Hora de cierre de hoy, interpolada en `statusTemplate`. */
  todayClose?: string;
  /** Título del modal de horarios. */
  modalTitle?: string;
  /** Horario semana completa (modal). */
  schedule: PwaConnectHoursDay[];
}

/**
 * Pantalla Connect With Us de la PWA (`/pwa/connect-with-us`), abierta desde el More.
 * Contacto + branding del cliente. El logo grande y el footer "powered by" no viven
 * aquí: el logo es el del cliente (branding) y el footer es marca fija del producto.
 */
export interface PwaConnectWithUsConfig {
  /** Título del header. Default "Connect With Us". */
  title?: string;
  /** Nombre bajo el logo; si se omite usa `client.nombre`. */
  orgName?: string;
  /** Redes sociales (URLs). */
  social?: PwaConnectSocial;
  /** Teléfono para el botón Call (tel:). */
  phone?: string;
  /** URL para el botón Website. */
  website?: string;
  /** Etiquetas de las 3 acciones (white-label). */
  actions?: { call: string; website: string; directions: string };
  /** Dirección mostrada bajo el mapa. */
  address?: string;
  /** Horario + modal. */
  hours?: PwaConnectHours;
  /**
   * Copyright del cliente. Soporta `{client_name}`, `{city}`, `{year}`.
   * Ej. "{client_name} is the official travel authority for the state of {city}©. {year}. All rights reserved."
   */
  copyright?: string;
  /** Ciudad/lugar interpolado en `{city}` del copyright. */
  city?: string;
}

/** Pantalla "Check Your Email" (paso 2 del flujo Forgot Password). */
export interface PwaForgotPasswordSentConfig {
  title: string;
  body: string;
  createAccountCta: string;
  tryAgainCta: string;
}

/** Flujo "Forgot Your Password" de la PWA (paso 1 email + paso 2 confirmación). */
export interface PwaForgotPasswordConfig {
  /** Paso 1 — Forgot Your Password? */
  title: string;
  body: string;
  emailPlaceholder: string;
  resetCta: string;
  createAccountCta: string;
  /** Paso 2 — Check Your Email. */
  sent: PwaForgotPasswordSentConfig;
}

/** Modal compacto de error de login (validación mock fallida). */
export interface PwaLoginErrorConfig {
  title: string;
  body: string;
  tryAgainCta: string;
  createAccountCta: string;
}

/** Paso 2-4 del Create Account (Upload Picture + action sheet de foto). */
export interface PwaCreateAccountPhotoConfig {
  title: string;
  subtitle: string;
  addPhoto: string;
  /** Texto que se muestra si no llega el nombre por query param. */
  fullNameFallback: string;
  skipCta: string;
  saveCta: string;
  cancelCta: string;
  /** Action sheet de origen de la foto. */
  takePhoto: string;
  chooseGallery: string;
  cancelSheet: string;
  /** Hint de tamaño máximo (≤5 MB). */
  sizeHint: string;
}

/** Flujo "Create Account" (signup) de la PWA. Auth mockeado (solo frontend). */
export interface PwaCreateAccountConfig {
  /** Título del header (paso 1). */
  title: string;
  /** Placeholders de los campos del form. */
  namePlaceholder: string;
  emailPlaceholder: string;
  countryPlaceholder: string;
  statePlaceholder: string;
  zipPlaceholder: string;
  passwordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  /** Texto de ayuda de la contraseña. */
  helperText: string;
  signUpCta: string;
  /** Lista de países (reusa los valores de COMMON_COUNTRIES). */
  countries: GuestbookCountry[];
  /** Título del bottom-sheet de selección de país. */
  countrySheetTitle: string;
  /** Modal de error de validación (campos inválidos). */
  error: { title: string; body: string; okCta: string };
  /** Pasos 2-4 (Upload Picture). */
  photo: PwaCreateAccountPhotoConfig;
}

/** Card de "MY FAVORITES LIST" del Profile. */
export interface PwaProfileFavorite {
  title: string;
  subcategory: string;
  /** Línea superior (ej. "7.5 mi · Phoenix, AZ"). */
  distance: string;
  /** Línea inferior (ej. "Open until 11:00 pm"). */
  hours: string;
  image: string;
}

/** Card de "UPCOMING EVENTS" del Profile. */
export interface PwaProfileEvent {
  title: string;
  /** Ej. "7:00 pm - Location". */
  time: string;
  /** Día de la semana del badge (ej. "Thursday"). */
  weekday: string;
  /** Número del día (ej. "27"). */
  day: string;
  image: string;
  /** Color de la banda inferior: brand o pwa. */
  accent: 'brand' | 'pwa';
}

/** Usuario mock del Profile. */
export interface PwaProfileUser {
  name: string;
  location: string;
  /** Ej. "52°F". */
  weather: string;
  /** Foto de perfil (asset o URL). */
  photo: string;
  /** Foto de fondo del hero. */
  heroImage: string;
}

/** Edit Profile (campos prellenados + acciones). */
export interface PwaEditProfileConfig {
  title: string;
  editPhoto: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  statePlaceholder: string;
  zipPlaceholder: string;
  countryPlaceholder: string;
  changePasswordCta: string;
  saveCta: string;
  /** Valores prellenados del usuario. */
  prefill: { name: string; email: string; state: string; zip: string; country: string };
}

/** Change Password (form + error + success). */
export interface PwaChangePasswordConfig {
  title: string;
  body: string;
  newPlaceholder: string;
  confirmPlaceholder: string;
  helper: string;
  establishCta: string;
  error: { title: string; body: string; tryAgainCta: string; closeCta: string };
  success: { title: string; doneCta: string };
}

/** Settings (lista con Delete my Account). */
export interface PwaSettingsConfig {
  title: string;
  deleteRow: string;
}

/** Flujo Delete Account (reason → [other] → confirm → survey). */
export interface PwaDeleteFlowConfig {
  title: string;
  surveyTitle: string;
  reason: { heading: string; options: string[]; continueCta: string };
  other: { heading: string; placeholder: string; continueCta: string };
  confirm: {
    heading: string;
    sendDataLabel: string;
    passwordPlaceholder: string;
    warning: string;
    continueCta: string;
  };
  survey: { question: string; options: string[]; deleteCta: string };
}

/** Sección Profile de la PWA (10 pantallas). */
export interface PwaProfileConfig {
  /** Link "Edit Profile" (top-right del Profile). */
  editProfileLink: string;
  user: PwaProfileUser;
  favorites: { title: string; viewMore: string; items: PwaProfileFavorite[] };
  upcomingEvents: { title: string; viewMore: string; items: PwaProfileEvent[] };
  editProfile: PwaEditProfileConfig;
  changePassword: PwaChangePasswordConfig;
  settings: PwaSettingsConfig;
  delete: PwaDeleteFlowConfig;
}

/**
 * Configuración de la PWA Mobile (companion app). Es un producto white-label
 * propio que comparte branding + data con el kiosk pero con diseño mobile.
 * Se va poblando por pantalla; de momento Welcome (P1) + Login + Dashboard + More.
 */
export interface PwaConfig {
  welcome?: PwaWelcomeConfig;
  login?: PwaLoginConfig;
  dashboard?: PwaDashboardConfig;
  more?: PwaMoreConfig;
  connectWithUs?: PwaConnectWithUsConfig;
  /** Flujo de recuperación de contraseña (2 pantallas). */
  forgotPassword?: PwaForgotPasswordConfig;
  /** Textos del modal de error de login. */
  loginError?: PwaLoginErrorConfig;
  /** Flujo de registro (Create Account + foto). */
  createAccount?: PwaCreateAccountConfig;
  /** Sección Profile (perfil, edición, password, settings, delete). */
  profile?: PwaProfileConfig;
  /** Pantalla de búsqueda (abierta desde la lupa del Dashboard). */
  search?: PwaSearchConfig;
}

/** Pantalla de Search de la PWA (textos; el índice se construye desde la data). */
export interface PwaSearchConfig {
  placeholder: string;
  recentTitle: string;
  browseTitle: string;
  clearAll: string;
  /** Plantilla "No results for …" (soporta `{query}`). */
  noResults: string;
  /** Subtítulo por tipo de resultado. */
  typeSection: string;
  typeEvent: string;
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
    /** Logo usado sobre fondos oscuros (billboard idle, splash PWA). Default: `logo.default`. */
    idleLogo?: string;
    /** Logo del footer. Default: `logo.default`. */
    footerLogo?: string;
    favicon?: string;
  };
  textos: Record<string, string>;
  navegacion?: Record<string, string>;
  assets?: Record<string, string>;
  features?: {
    /** Configuración multi-idioma. Si `enabled=false` el LanguageDropdown se
     *  oculta y el kiosk queda fijo en `default`. */
    languages?: LanguagesConfig;
    mostrar_reloj?: boolean;
    inactividad_reset_seg?: number;
    permitir_compartir_qr?: boolean;
    /** Variante del Billboard idle (0-4). Default 0 si no se declara. */
    billboard_variant?: 0 | 1 | 2 | 3 | 4;
    /** Configuración del Main Dashboard / Home. */
    home?: {
      tiles: HomeTile[];
      /** Tamaño global (px) de la tipografía de los títulos de los tiles del
       *  grid. Si `undefined`, el runtime usa el default de 50px. */
      tileTitleFontSize?: number;
      wayfinding?: {
        enabled: boolean;
        label: string;
        image: string;
      };
      survey?: SurveyConfig;
      listings: HomeListing[];
      /** Módulos configurables (Listings o Events). Discriminados por `kind`. */
      modules?: Record<string, HomeModuleVariant>;
      /** Módulo Ask AI (avatar flotante + modal). Sibling, no es un module variant
       *  porque no es un tile del grid ni tiene ruta `/home/{key}` propia. */
      askAi?: AskAiConfig;
      /** Módulo Photo Booth (captura + editor + share). Ruta `/home/photo-booth`. */
      photoBooth?: PhotoBoothConfig;
      /** Módulo Trip Builder. Ruta `/home/itinerary-builder`. */
      itinerary?: ItineraryConfig;
    };
    /** Catálogo de ads declarativo (Fase 3.8). */
    advertisements?: AdvertisementsConfig;
    /** Configuración de la PWA Mobile (companion app). */
    pwa?: PwaConfig;
  };
  integraciones?: {
    api_base_url?: string;
    analytics_id?: string;
    /** Token público de Mapbox para los mapas de listings. */
    mapbox_token?: string;
    /** Tavus — AI Avatar (replica + persona) que reemplaza el video placeholder. */
    tavus_api_key?: string;
    tavus_replica_id?: string;
    tavus_persona_id?: string;
    /** Satisfi Labs — chatbot backend, sin UI. */
    satisfi_api_key?: string;
    satisfi_hub_id?: string;
    /** Bandwango — feed de partner data (passes / deals / listings). */
    bandwango_api_key?: string;
    bandwango_partner_id?: string;
    /** CrowdRiff — agregador del Social Wall. */
    crowdriff_api_key?: string;
    crowdriff_gallery_id?: string;
    /** Viator — feed de tours/tickets. */
    viator_api_key?: string;
    viator_partner_id?: string;
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
