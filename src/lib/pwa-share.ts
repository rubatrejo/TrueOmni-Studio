/**
 * Compartir contenido desde la PWA vía Web Share API, con fallback a abrir el
 * enlace en una pestaña nueva cuando `navigator.share` no está disponible
 * (desktop, navegadores sin soporte). Centraliza la lógica usada por Events y
 * Passes para no duplicarla.
 */
export function pwaShare({
  title,
  text,
  url,
}: {
  title?: string;
  text?: string;
  url?: string;
}): void {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    navigator.share({ title, text, url }).catch(() => {});
  } else if (url && typeof window !== 'undefined') {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
