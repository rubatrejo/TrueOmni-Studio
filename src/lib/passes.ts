/** Resultado del share de un pass, serializable, listo para dispatch. */
export interface PassShareResult {
  timestamp: string;
  client: string;
  passSlug: string;
  passTitle: string;
  phone: string;
  bandwangoUrl: string;
}

/** Valida phone: sólo dígitos, min 10. */
export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, '');
  return digits.length >= 10;
}

/** Formatea phone a "+1-XXX-XXX-XXXX". */
export function formatPhone(raw: string, countryCode = '+1'): string {
  const digits = raw.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return `${countryCode}-${digits}`;
  return `${countryCode}-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Construye el resultado final del share. */
export function buildShareResult(params: {
  client: string;
  passSlug: string;
  passTitle: string;
  phone: string;
  bandwangoUrl: string;
}): PassShareResult {
  return {
    timestamp: new Date().toISOString(),
    client: params.client,
    passSlug: params.passSlug,
    passTitle: params.passTitle,
    phone: formatPhone(params.phone),
    bandwangoUrl: params.bandwangoUrl,
  };
}

/** Dispatch v1: console + CustomEvent. Sin persistencia. */
export function dispatchShareResult(result: PassShareResult): void {
  // eslint-disable-next-line no-console
  console.log('[kiosk:pass-share]', result);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kiosk:pass-shared', { detail: result }));
  }
}
