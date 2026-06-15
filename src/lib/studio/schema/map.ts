import { z } from 'zod';

import { ShortIdSchema, CoordsSchema } from './primitives';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Map module                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

/** Source lógico del pin custom — coincide con MapSource del kiosk runtime. */
export const MapSourceSchema = z.enum(['restaurants', 'things-to-do', 'stay', 'events']);
export type MapSourceKey = z.infer<typeof MapSourceSchema>;

/** Pin fijo añadido por el operador (no derivado de listings). */
export const MapCustomPinSchema = z.object({
  id: ShortIdSchema,
  label: z.string().min(1).max(120),
  /** Categoría del pin — controla el color y, si no hay `iconKey`, el icono. */
  source: MapSourceSchema.default('things-to-do'),
  /**
   * Icono del catálogo extendido (`shopping`, `coffee`, `bar`, `hospital`,
   * `museum`, `bus`, `beach`, `info`, `parking`, `star`). Si vacío, se usa
   * el icono canónico de la categoría (`source`).
   */
  iconKey: z.string().max(32).default(''),
  coords: CoordsSchema,
  /** Dirección humanizable opcional (se muestra en el bubble). */
  address: z.string().max(280).default(''),
});

/** Body por default del Map welcome popup. Se usa como fallback runtime
 *  cuando el operador no ha seteado un body custom (kiosks viejos en KV
 *  guardaron `body: ''`). Importable por componentes para renderizarlo
 *  cuando el body merged sale vacío. */
export const DEFAULT_MAP_WELCOME_BODY =
  'Tap a pin to see details — restaurants, things to do, places to stay and upcoming events near you.';

export const MapWelcomeCopySchema = z.object({
  title: z.string().max(160).default('Welcome to {client} Map'),
  subtitle: z.string().max(160).default('Powered by Google Maps'),
  body: z.string().max(600).default(DEFAULT_MAP_WELCOME_BODY),
  cta: z.string().max(64).default('Start'),
});

export const MapChipsSchema = z.object({
  play: z.string().max(48).default('Things to Do'),
  eat: z.string().max(48).default('Restaurants'),
  stay: z.string().max(48).default('Stay'),
  events: z.string().max(48).default('Events'),
});

export const MapPinSizeSchema = z.enum(['S', 'M', 'L']);
export type MapPinSize = z.infer<typeof MapPinSizeSchema>;

/** Multiplicador `icon-size` que aplica Mapbox al pin SVG default 140×188. */
export const MAP_PIN_SIZE_SCALE: Record<MapPinSize, number> = {
  S: 0.75,
  M: 1.0,
  L: 1.3,
};

/** Override de icono por categoría — vacío = icono canónico de la categoría. */
export const MapCategoryIconsSchema = z.object({
  restaurants: z.string().max(32).default(''),
  'things-to-do': z.string().max(32).default(''),
  stay: z.string().max(32).default(''),
  events: z.string().max(32).default(''),
});

export const MapSchema = z.object({
  /** Centro inicial del mapa al abrir el módulo. Si vacío usa `client.coords`. */
  defaultCenter: CoordsSchema.optional(),
  /** Zoom inicial (1–22, default 13 = ciudad). */
  defaultZoom: z.number().min(1).max(22).default(13),
  /** Ventana de eventos a mostrar (días desde hoy). */
  eventsWindowDays: z.number().int().min(1).max(60).default(7),
  /** Tamaño global de TODOS los pins (canónicos + custom). */
  pinSize: MapPinSizeSchema.default('M'),
  /** Override del icono por categoría (escoger del catálogo extendido). */
  categoryIcons: MapCategoryIconsSchema.default({
    restaurants: '',
    'things-to-do': '',
    stay: '',
    events: '',
  }),
  /** Labels de los chips de categoría (sobre los 4 sources canónicos). */
  chips: MapChipsSchema.default({
    play: 'Things to Do',
    eat: 'Restaurants',
    stay: 'Stay',
    events: 'Events',
  }),
  /** Welcome popup al abrir el módulo. Si todos los campos están vacíos, no se muestra. */
  welcomeCopy: MapWelcomeCopySchema.default({
    title: 'Welcome to {client} Map',
    subtitle: 'Powered by Google Maps',
    body: DEFAULT_MAP_WELCOME_BODY,
    cta: 'Start',
  }),
  /** Pins fijos custom (no derivados de listings). Se añaden al canvas como pins extra. */
  customPins: z.array(MapCustomPinSchema).default([]),
});

export type MapConfig = z.infer<typeof MapSchema>;
export type MapCustomPin = z.infer<typeof MapCustomPinSchema>;

export const DEFAULT_MAP: MapConfig = {
  defaultZoom: 13,
  eventsWindowDays: 7,
  pinSize: 'M',
  categoryIcons: { restaurants: '', 'things-to-do': '', stay: '', events: '' },
  chips: { play: 'Things to Do', eat: 'Restaurants', stay: 'Stay', events: 'Events' },
  welcomeCopy: {
    title: 'Welcome to {client} Map',
    subtitle: 'Powered by Google Maps',
    body: DEFAULT_MAP_WELCOME_BODY,
    cta: 'Start',
  },
  customPins: [],
};
