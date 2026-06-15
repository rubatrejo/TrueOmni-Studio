/**
 * Cache del último override de system modules empujado por el Studio
 * (`window.__kioskSystemModulesOverride`, lo escribe `studio-bridge`).
 *
 * Los hosts globales del preview (ads, AI avatar, selector de idioma) escuchan
 * el evento `kiosk:system-modules-override`, pero como ese evento es
 * fire-and-forget, un host que se monta DESPUÉS del toggle (navegación interna
 * del iframe / el preview venía de otra pantalla) no lo capturaba y seguía
 * visible. Leyendo este cache en su estado inicial, cada host respeta el toggle
 * aunque monte tarde. Fuera del preview el cache nunca existe → sin efecto.
 */
export type SystemModulesCache = {
  ads?: boolean;
  languages?: boolean;
  aiAvatar?: boolean;
  [key: string]: boolean | undefined;
};

export function readSystemModulesCache(): SystemModulesCache | null {
  if (typeof window === 'undefined') return null;
  return (
    (window as Window & { __kioskSystemModulesOverride?: SystemModulesCache })
      .__kioskSystemModulesOverride ?? null
  );
}

/**
 * Resuelve el estado `hidden` inicial (y de re-sincronización) de un host
 * global del Home a partir del cache del Studio.
 *
 * Regla: si el preview empujó un override booleano para esa key, GANA sobre el
 * `fallbackEnabled` del config (que en el preview siempre llega "on" porque el
 * iframe renderiza el config `default` del filesystem, no el del KV). Fuera del
 * Studio el cache no existe → manda `fallbackEnabled`.
 *
 * Única fuente de verdad para los 3 hosts (ads, languages, aiAvatar): tanto su
 * `useState` inicial como cualquier efecto de re-sync deben llamar a esto, para
 * que un efecto no "pise" el cache al montar (regresión del FAB de Ask AI).
 */
export function resolveSystemModuleHidden(
  key: 'ads' | 'languages' | 'aiAvatar',
  fallbackEnabled: boolean,
): boolean {
  const cached = readSystemModulesCache();
  if (cached && typeof cached[key] === 'boolean') return !cached[key];
  return !fallbackEnabled;
}
