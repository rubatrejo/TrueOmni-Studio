/**
 * Visibilidad de módulos de la PWA — fuente ÚNICA de la lógica de herencia
 * Kiosk → PWA + override manual.
 *
 * El Kiosk Portrait es el producto principal: por default la PWA HEREDA la
 * visibilidad de módulos del kiosk (`features.home.modules.systemModules`). El
 * operador puede override manualmente en la PWA vía `features.pwa.moduleVisibility`
 * (`{ <moduleKey>: boolean }`). La herencia es por LECTURA — no se copia estado:
 *
 *   visibilidad efectiva =
 *     pwa.moduleVisibility[key]              (si el operador hizo override)
 *     ?? kioskSystemModules[field] !== false (módulo compartido → hereda del kiosk)
 *     ?? true                                (módulo PWA-only sin override → ON)
 *
 * Tanto el editor (panel "Modules") como el runtime de la PWA usan estas
 * funciones para resolver qué módulos se ven.
 */
import type { SystemModules } from '@/lib/studio/schema';

/** Módulos que existen en AMBOS productos → heredan del kiosk por default. */
export const PWA_SHARED_MODULES = [
  'restaurants',
  'things-to-do',
  'events',
  'passes',
  'tickets',
  'deals',
  'trails',
  'map',
  'digital-brochure',
  'social-wall',
  'stay',
  'wayfinding',
  'trip-planner',
] as const;

/**
 * Módulos exclusivos de la PWA (no existen en el kiosk) → toggle manual, default
 * ON, sin herencia. Conservador a propósito: solo features opcionales, NUNCA el
 * chrome core (welcome/login/dashboard/profile/more/search/notifications), cuyo
 * apagado rompería la app.
 */
export const PWA_ONLY_MODULES = ['scavenger-hunt', 'connect-with-us', 'help'] as const;

/** Todas las keys que el panel "Modules" de la PWA puede activar/desactivar. */
export const PWA_TOGGLEABLE_MODULES: readonly string[] = [
  ...PWA_SHARED_MODULES,
  ...PWA_ONLY_MODULES,
];

/**
 * Mapeo de la key del módulo PWA (kebab) → su campo en el `systemModules` del
 * kiosk (camelCase), para los módulos compartidos. `trip-planner` mapea al
 * `itineraryBuilder` del kiosk (mismo módulo, key distinta).
 */
export const PWA_KEY_TO_KIOSK_FIELD: Readonly<Record<string, keyof SystemModules>> = {
  restaurants: 'restaurants',
  'things-to-do': 'thingsToDo',
  events: 'events',
  passes: 'passes',
  tickets: 'tickets',
  deals: 'deals',
  trails: 'trails',
  map: 'map',
  'digital-brochure': 'digitalBrochure',
  'social-wall': 'socialWall',
  stay: 'stay',
  wayfinding: 'wayfinding',
  'trip-planner': 'itineraryBuilder',
};

export interface PwaVisibilityInput {
  /** `systemModules` del kiosk del cliente (read-only, fuente de la herencia). */
  kioskSystemModules?: Partial<SystemModules> | null;
  /** Override manual de la PWA (`features.pwa.moduleVisibility`). */
  pwaModuleVisibility?: Record<string, boolean> | null;
}

/** ¿Es `key` un módulo que la PWA puede activar/desactivar? */
export function isPwaToggleableModule(key: string): boolean {
  return PWA_TOGGLEABLE_MODULES.includes(key);
}

/** ¿`key` es un módulo compartido con el kiosk (puede heredar)? */
export function isPwaSharedModule(key: string): boolean {
  return key in PWA_KEY_TO_KIOSK_FIELD;
}

/**
 * Visibilidad EFECTIVA de un módulo en la PWA (override → herencia → default ON).
 * Para keys que no son módulos toggleables, siempre `true` (chrome core).
 */
export function isPwaModuleVisible(key: string, input: PwaVisibilityInput): boolean {
  const override = input.pwaModuleVisibility?.[key];
  if (typeof override === 'boolean') return override; // override manual del operador
  const field = PWA_KEY_TO_KIOSK_FIELD[key];
  if (field) return input.kioskSystemModules?.[field] !== false; // hereda del kiosk
  return true; // PWA-only sin override (o no es módulo) → ON
}

/**
 * ¿La visibilidad de `key` viene HEREDADA del kiosk (sin override manual)?
 * Solo aplica a módulos compartidos. Usado para el badge "Synced with Kiosk".
 */
export function isPwaModuleInherited(
  key: string,
  pwaModuleVisibility?: Record<string, boolean> | null,
): boolean {
  return typeof pwaModuleVisibility?.[key] !== 'boolean' && isPwaSharedModule(key);
}

/** Mapa de visibilidad efectiva para TODOS los módulos toggleables. */
export function resolvePwaVisibility(input: PwaVisibilityInput): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const key of PWA_TOGGLEABLE_MODULES) out[key] = isPwaModuleVisible(key, input);
  return out;
}
