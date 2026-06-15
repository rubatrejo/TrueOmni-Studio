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
