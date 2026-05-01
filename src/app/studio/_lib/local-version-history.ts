/**
 * Timeline de versiones LOCAL (localStorage) para el VersionsEditor.
 *
 * Es un placeholder hasta que la fase S7.2 (GitHub PR-publish) entregue
 * versioning real basado en commits. Mientras tanto, registramos cada
 * "Save" y "Publish" del Studio con timestamp + editor para que el operador
 * tenga evidencia visible de que su trabajo no se perdió (audit F-10).
 *
 * Storage:
 *   - Una key por slug → `studio:versions:<slug>`.
 *   - Capped a las últimas 50 entradas (el array es FIFO desde el más
 *     reciente: `unshift` al añadir, `slice(0, 50)`).
 *   - Acceso defensivo: si el storage no está disponible (SSR, modo
 *     privado), todas las funciones devuelven sin errar.
 */

export type LocalVersionEntry = {
  /** ISO timestamp del evento. */
  ts: string;
  /** Email/handle del operador (best-effort, hoy hardcoded en Shell). */
  editor: string;
  /** Tipo de evento — 'save' = setState saved tras debounce, 'publish' = botón Publish OK. */
  type: 'save' | 'publish';
  /** Solo aplica a 'publish' — número de versión post-publish. */
  version?: number;
  /** Resumen libre opcional ("Branding", "Modules"…) — null por ahora. */
  summary?: string;
};

const MAX_ENTRIES = 50;
const KEY_PREFIX = 'studio:versions:';

function key(slug: string) {
  return `${KEY_PREFIX}${slug}`;
}

function safeRead(slug: string): LocalVersionEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is LocalVersionEntry =>
        e &&
        typeof e === 'object' &&
        typeof e.ts === 'string' &&
        typeof e.editor === 'string' &&
        (e.type === 'save' || e.type === 'publish'),
    );
  } catch {
    return [];
  }
}

function safeWrite(slug: string, entries: LocalVersionEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key(slug), JSON.stringify(entries.slice(0, MAX_ENTRIES)));
  } catch {
    // QuotaExceeded o storage deshabilitado — silently fail.
  }
}

export function getHistory(slug: string): LocalVersionEntry[] {
  return safeRead(slug);
}

export function recordSave(slug: string, editor: string, summary?: string) {
  const list = safeRead(slug);
  const now = new Date().toISOString();
  // Coalesce: si la última entrada es un save del mismo editor en los últimos
  // 30s, la actualizamos en vez de añadir una nueva. Evita ruido cuando el
  // operador edita rápido y el debounce dispara muchos saves.
  const last = list[0];
  if (last && last.type === 'save' && last.editor === editor) {
    const elapsed = Date.now() - new Date(last.ts).getTime();
    if (elapsed < 30_000) {
      list[0] = { ...last, ts: now, summary: summary ?? last.summary };
      safeWrite(slug, list);
      return;
    }
  }
  list.unshift({ ts: now, editor, type: 'save', summary });
  safeWrite(slug, list);
}

export function recordPublish(slug: string, version: number, editor: string) {
  const list = safeRead(slug);
  list.unshift({
    ts: new Date().toISOString(),
    editor,
    type: 'publish',
    version,
  });
  safeWrite(slug, list);
}

export function clearHistory(slug: string) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key(slug));
  } catch {}
}
