/**
 * Regex único para validar slugs de cliente del Studio (kiosk + signage).
 *
 * F-CORE-11: antes cada endpoint definía su propio patrón y divergían —
 * el publish aceptaba guion final (`…[a-z0-9]?$`), el create/clone no, y el
 * catch-all de assets usaba `^[a-z0-9-]+$` (permitía guion inicial/final y
 * cadenas de solo guiones). Fuente única para que todos validen igual.
 *
 * Reglas: minúsculas, dígitos y guiones internos; 1–64 caracteres; sin guion
 * al inicio ni al final. (No aplica a nombres de archivo de `upload/`, que
 * tienen su propia sanitización.)
 */
export const STUDIO_SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;

/** True si `slug` es un slug de cliente válido del Studio. */
export function isValidStudioSlug(slug: string): boolean {
  return STUDIO_SLUG_REGEX.test(slug);
}
