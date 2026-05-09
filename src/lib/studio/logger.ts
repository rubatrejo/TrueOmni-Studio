import 'server-only';

/**
 * Logger estructurado del Studio. JSON-line en una sola línea para que
 * Vercel logs y `next dev` los muestren legibles + parseables. Hallazgos
 * S-38 (sync hook fail silencioso) y S-42 (client:list sin observability)
 * del audit panorámico v2.
 *
 * Antes el código del sync usaba `console.warn` con strings de prefijos
 * variables; difícil de grep, imposible de alertar.
 *
 * No agregamos un transport (Datadog, Sentry) — eso vive en una sub-fase
 * futura. Por ahora `console.log/warn/error` con shape estable es
 * suficiente para `vercel logs --follow` + Diagnostics.
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'alert';

export interface LogFields {
  /** Identificador del evento, e.g. `client.added`, `sync.failed`. */
  event: string;
  /** Slug del cliente afectado, si aplica. */
  slug?: string;
  /** Email u otro identificador del actor que disparó la mutación. */
  by?: string;
  /** Detalle adicional libre. Se serializa con JSON.stringify (cap 4KB). */
  details?: Record<string, unknown>;
  /** Mensaje humano corto. */
  message?: string;
}

const MAX_DETAILS_LENGTH = 4_000;

export function studioLog(level: LogLevel, fields: LogFields): void {
  const detailsStr = fields.details
    ? safeStringify(fields.details).slice(0, MAX_DETAILS_LENGTH)
    : undefined;

  const payload = {
    ts: new Date().toISOString(),
    level,
    event: fields.event,
    ...(fields.slug !== undefined ? { slug: fields.slug } : null),
    ...(fields.by !== undefined ? { by: fields.by } : null),
    ...(fields.message !== undefined ? { message: fields.message } : null),
    ...(detailsStr ? { details: detailsStr } : null),
  };

  const serialized = `[studio] ${safeStringify(payload)}`;

  // eslint-disable-next-line no-console
  switch (level) {
    case 'info':
      console.log(serialized);
      break;
    case 'warn':
      console.warn(serialized);
      break;
    case 'error':
    case 'alert':
      console.error(serialized);
      break;
  }
}

/**
 * Helper directo para los call-sites. `studioLog.info({event,...})` etc.
 */
studioLog.info = (fields: LogFields) => studioLog('info', fields);
studioLog.warn = (fields: LogFields) => studioLog('warn', fields);
studioLog.error = (fields: LogFields) => studioLog('error', fields);
studioLog.alert = (fields: LogFields) => studioLog('alert', fields);

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
