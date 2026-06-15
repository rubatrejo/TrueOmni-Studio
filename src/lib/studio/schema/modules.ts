import { z } from 'zod';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Modules                                                                  */
/* ────────────────────────────────────────────────────────────────────────── */

const ModuleKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, {
    message: 'module key must be lowercase letters, digits and hyphens.',
  });

export const ModuleEntrySchema = z.object({
  /** Identificador kebab-case. Ruta del kiosk = `/home/{key}`. Único en la lista. */
  key: ModuleKeySchema,
  /** Label visual del tile. Puede contener `\n` para forzar salto. */
  label: z.string().min(1).max(64),
  /** Si false, el tile se oculta del grid del Home. */
  enabled: z.boolean(),
  /** Si true, el tile ocupa el ancho completo del grid (las 2 columnas). */
  wide: z.boolean().optional(),
  /**
   * Imagen de fondo del tile (path `/assets/home/tiles/{key}.jpg` o data URL).
   * Opcional: si `undefined`, el publish preserva la imagen del filesystem por
   * `key`. Editable desde el Home Dashboard del Studio (igual que la PWA).
   */
  image: z.string().optional(),
});

/**
 * Toggles maestros de TODOS los módulos del kiosk. Si un módulo está OFF
 * aquí, el cliente no lo ha "comprado" y no aparece en ningún sitio:
 *   - HomeDashboardEditor lo oculta (no se puede reordenar ni renombrar).
 *   - El runtime del kiosk lo esconde del grid + de la deep link.
 *
 * Cubre los 16 tiles del Home + 3 sub-sistemas globales (ads, languages,
 * ai avatar). El nombre del schema sigue siendo `SystemModulesSchema` por
 * compatibilidad con KV escritos antes de S2.5.
 */
export const SystemModulesSchema = z.object({
  // Home tiles (1:1 con KIOSK_MODULES de abajo).
  restaurants: z.boolean().default(true),
  thingsToDo: z.boolean().default(true),
  itineraryBuilder: z.boolean().default(true),
  events: z.boolean().default(true),
  passes: z.boolean().default(true),
  tickets: z.boolean().default(true),
  guestbook: z.boolean().default(true),
  socialWall: z.boolean().default(true),
  digitalBrochure: z.boolean().default(true),
  map: z.boolean().default(true),
  stay: z.boolean().default(true),
  survey: z.boolean().default(true),
  deals: z.boolean().default(true),
  photoBooth: z.boolean().default(true),
  trails: z.boolean().default(true),
  wayfinding: z.boolean().default(true),
  // Globales (no son tiles pero el kiosk los renderiza).
  ads: z.boolean().default(true),
  languages: z.boolean().default(true),
  aiAvatar: z.boolean().default(true),
});

export const ModulesSchema = z.object({
  /**
   * Lista plana y ordenada de los 16 módulos del Home (15 categorías + wayfinding).
   * El orden visual del grid lo dicta este array. Wayfinding va aquí también
   * porque desde el Studio se trata como un tile más; al publicar (Fase S7)
   * el script splittea esta lista en `features.home.tiles[]` + `features.home.wayfinding`.
   */
  tiles: z.array(ModuleEntrySchema).min(1).max(64),
  /** Toggles para módulos system-wide que no son tiles del grid. */
  systemModules: SystemModulesSchema.optional(),
  /**
   * Override de iconos Lucide por moduleKey (events, tickets, passes, trails, etc).
   * El operador escoge el icono desde el Modules tab. Si vacío/undefined,
   * se usa el icono canónico de `MODULE_ICONS`.
   */
  iconOverrides: z.record(z.string(), z.string()).default({}),
  /**
   * Imágenes custom (data URL o path) por moduleKey. Sobrescribe ambos
   * `iconOverrides` y el icono canónico cuando está poblado para un key.
   * Mismas dimensiones que un Lucide para coherencia visual.
   */
  customIcons: z.record(z.string(), z.string()).default({}),
  /**
   * Tamaño global (px) de la tipografía de los títulos de los tiles del Home
   * Dashboard. Aplica a TODOS los tiles por igual (grid uniforme). Si
   * `undefined`, el runtime usa el default de `category-tile` (50px verbatim
   * del SVG Dashboard).
   */
  tileTitleFontSize: z.number().int().min(20).max(120).optional(),
});

export type ModuleEntry = z.infer<typeof ModuleEntrySchema>;
export type ModulesConfig = z.infer<typeof ModulesSchema>;
export type SystemModules = z.infer<typeof SystemModulesSchema>;

export const DEFAULT_SYSTEM_MODULES: SystemModules = {
  restaurants: true,
  thingsToDo: true,
  itineraryBuilder: true,
  events: true,
  passes: true,
  tickets: true,
  guestbook: true,
  socialWall: true,
  digitalBrochure: true,
  map: true,
  stay: true,
  survey: true,
  deals: true,
  photoBooth: true,
  trails: true,
  wayfinding: true,
  ads: true,
  languages: true,
  aiAvatar: true,
};

/**
 * Mapeo de la `key` del tile (kebab-case) ↔ el campo en `SystemModulesSchema`
 * (camelCase). Útil para filtrar tiles según los toggles.
 */
export const MODULE_KEY_TO_SYSTEM_FIELD: Record<string, keyof SystemModules> = {
  restaurants: 'restaurants',
  'things-to-do': 'thingsToDo',
  'itinerary-builder': 'itineraryBuilder',
  events: 'events',
  passes: 'passes',
  tickets: 'tickets',
  guestbook: 'guestbook',
  'social-wall': 'socialWall',
  'digital-brochure': 'digitalBrochure',
  map: 'map',
  stay: 'stay',
  survey: 'survey',
  deals: 'deals',
  'photo-booth': 'photoBooth',
  trails: 'trails',
  wayfinding: 'wayfinding',
};

/**
 * Catálogo canónico de módulos del kiosk en el orden por defecto del template.
 * Si un cliente recién creado no trae `modules`, se inicializa con esto.
 */
export const KIOSK_MODULES: readonly ModuleEntry[] = [
  { key: 'restaurants', label: 'Restaurants', enabled: true },
  { key: 'things-to-do', label: 'Things\nto Do', enabled: true },
  { key: 'itinerary-builder', label: 'Trip Planner', enabled: true },
  { key: 'events', label: 'Events', enabled: true },
  { key: 'passes', label: 'Passes', enabled: true },
  { key: 'tickets', label: 'Tickets', enabled: true },
  { key: 'guestbook', label: 'Guestbook', enabled: true },
  { key: 'social-wall', label: 'Social Wall', enabled: true },
  { key: 'digital-brochure', label: 'Digital Brochure', enabled: true },
  { key: 'map', label: 'Map', enabled: true },
  { key: 'stay', label: 'Stay', enabled: true },
  { key: 'survey', label: 'Survey', enabled: true },
  { key: 'deals', label: 'Deals', enabled: true },
  { key: 'photo-booth', label: 'Photo Booth', enabled: true },
  { key: 'trails', label: 'Trails', enabled: true },
  { key: 'wayfinding', label: 'Wayfinding', enabled: true },
] as const;

export function defaultModules(): ModulesConfig {
  return {
    tiles: KIOSK_MODULES.map((m) => ({ ...m })),
    systemModules: { ...DEFAULT_SYSTEM_MODULES },
    iconOverrides: {},
    customIcons: {},
  };
}
