/**
 * Helpers para detectar y embed videos de YouTube en el runtime.
 *
 * El campo `brandVideo` del unified branding acepta dos kinds:
 *   - `upload`  → src es un data URL / path local de un MP4 / WebM.
 *   - `youtube` → src es la URL del video (ej. `https://youtu.be/abc123`).
 *
 * En upload el runtime usa `<video>` HTML directo. En YouTube necesita
 * un `<iframe>` apuntando a `https://www.youtube.com/embed/<id>` con los
 * params adecuados para autoplay loop muted. Estos helpers extraen el
 * id y arman la URL embed.
 */

/**
 * Extrae el video ID de una URL de YouTube. Soporta:
 *   - `youtu.be/ID`
 *   - `youtube.com/watch?v=ID`
 *   - `youtube.com/embed/ID`
 *   - `youtube.com/shorts/ID`
 *
 * Devuelve `null` si no es una URL reconocida.
 */
export function extractYouTubeId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  let m = trimmed.match(/youtu\.be\/([\w-]{11})/i);
  if (m) return m[1];
  m = trimmed.match(/[?&]v=([\w-]{11})/i);
  if (m) return m[1];
  m = trimmed.match(/youtube\.com\/(?:embed|shorts)\/([\w-]{11})/i);
  if (m) return m[1];
  return null;
}

/** True si la URL es de YouTube y el helper sabe extraer su ID. */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * URL embed para `<iframe>` con params loop + autoplay + muted + sin chrome.
 * `loop=1` solo funciona si también pasamos `playlist=<id>` (workaround
 * documentado de la IFrame API). `mute=1` es requisito de los browsers
 * modernos para autoplay sin gesto del usuario, así que `muted` default true;
 * el caller lo pone en false cuando el operador activó el audio explícitamente
 * (F-SIGNAGE-5) — en pantallas de signage dedicadas el autoplay con sonido sí
 * está permitido.
 */
export function buildYouTubeEmbedUrl(idOrUrl: string, muted: boolean = true): string | null {
  const id = idOrUrl.length === 11 ? idOrUrl : extractYouTubeId(idOrUrl);
  if (!id) return null;
  const params = new URLSearchParams({
    autoplay: '1',
    mute: muted ? '1' : '0',
    loop: '1',
    playlist: id,
    controls: '0',
    showinfo: '0',
    modestbranding: '1',
    rel: '0',
    iv_load_policy: '3',
    playsinline: '1',
  });
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}
