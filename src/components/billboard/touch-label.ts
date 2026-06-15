/**
 * Aplica el case del "Touch Here" del idle.
 *
 * - `uppercase: true`  → MAYÚSCULAS.
 * - `uppercase: false` (default) → Title Case: primera letra de cada palabra en
 *   mayúscula y el resto en minúscula.
 *
 * Se hace en JS (no con `text-transform: capitalize`) porque el string fuente
 * suele venir ya en MAYÚSCULAS (i18n `billboard_touch_here`), y `capitalize`
 * solo toca la primera letra sin bajar el resto → seguiría viéndose "TOUCH
 * HERE". Preserva los `\n` (whitespace) del layout de 2 líneas.
 */
export function toTouchCase(text: string, uppercase: boolean): string {
  if (uppercase) return text.toUpperCase();
  return text.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}
