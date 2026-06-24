/**
 * Detección de runtime de la PWA, compartida por `MobileCanvas` y `DeviceProvider`
 * (una sola fuente de verdad). Pura, client-side; SSR siempre devuelve `false`.
 */

/** PWA instalada (añadida a inicio): el SO la lanza full-screen sin chrome del navegador. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  // iOS Safari expone `navigator.standalone`; el resto, el media query estándar.
  const iosStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches;
}
