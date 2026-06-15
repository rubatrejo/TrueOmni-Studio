import type { ModulesConfig } from '@/lib/studio/schema';

/**
 * Igualdad de `modules` para la detección de cambios sin guardar (dirty) del
 * Modules tab del kiosk.
 *
 * Comparación full JSON: cubre TODOS los campos actuales y futuros sin riesgo de
 * olvidar añadir uno al extender el schema. El compare field-by-field anterior
 * (`shallowEqualModules`) solo miraba `tiles.{key,label,enabled}` + 3 toggles
 * globales, así que cambios en `tileTitleFontSize`, `tileOverlayOpacity`,
 * `tiles.wide`, `tiles.image`, `iconOverrides` y `customIcons` NUNCA marcaban
 * dirty → el botón Save quedaba opaco. Misma lección que `shallowEqualBillboard`
 * (que ya migró a JSON.stringify por idéntico bug histórico).
 *
 * Es seguro contra falsos "dirty": `modules` y `savedModules` se construyen del
 * mismo objeto (`initialModules` al montar; el propio `modules` tras guardar),
 * por lo que comparten orden de claves y forma.
 */
export function modulesEqual(a: ModulesConfig, b: ModulesConfig): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
