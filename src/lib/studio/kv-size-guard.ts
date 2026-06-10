/**
 * Guard de tamaño para valores de config que se escriben a KV.
 *
 * F-CORE-12: el límite vivía inline solo en el PATCH del kiosk (`configs`
 * route, cap 950KB) y en el de i18n (cap 480KB, bundle más pequeño). La PWA y
 * signage escribían su config a KV SIN límite, así que un config inflado (p. ej.
 * por data-URIs antes de F-PWA-3) podía superar el máximo del valor de KV y
 * fallar el write de forma opaca. Este helper centraliza el chequeo para
 * aplicarlo en esos writes; los endpoints kiosk/i18n conservan su cap propio.
 */

/** Cap por defecto (≈ el del kiosk config). Bytes del JSON serializado. */
export const KV_VALUE_BYTE_CAP = 950_000;

export interface KvSizeCheck {
  tooLarge: boolean;
  sizeBytes: number;
  sizeKb: number;
  capKb: number;
}

/** Mide el tamaño serializado de `value` contra `cap`. */
export function checkKvValueSize(value: unknown, cap: number = KV_VALUE_BYTE_CAP): KvSizeCheck {
  const sizeBytes = JSON.stringify(value).length;
  return {
    tooLarge: sizeBytes > cap,
    sizeBytes,
    sizeKb: Math.round(sizeBytes / 1024),
    capKb: Math.round(cap / 1024),
  };
}
