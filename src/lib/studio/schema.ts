/**
 * Schemas zod para el Studio.
 *
 * Por ahora cubrimos solo el subset que la Fase S1 necesita: identidad
 * del cliente + branding (3 brand colors, logo, favicon, fonts). Se
 * irán ampliando en fases siguientes (S2 modules, S3 content, etc.).
 *
 * Conviven con el `clients/_template/config.schema.json` que sigue
 * siendo la fuente de verdad estructural; este archivo añade la
 * validación tipada para la API del Studio.
 */

/**
 * Barrel del schema del Studio. El monolito (2371 líneas) se partió por dominio
 * (F-QA-12 del audit STUDIO-AUDIT-2026-06-09) bajo `./schema/`. Este archivo
 * re-exporta cada dominio para mantener el import estable `@/lib/studio/schema`
 * sin tocar ningún consumidor. Las primitivas compartidas (`./schema/primitives`)
 * NO se re-exportan a propósito — eran privadas en el monolito.
 */

export * from './schema/branding';
export * from './schema/modules';
export * from './schema/billboard';
export * from './schema/ai-avatar';
export * from './schema/survey';
export * from './schema/deals';
export * from './schema/photo-booth';
export * from './schema/brochure';
export * from './schema/social-wall';
export * from './schema/guestbook';
export * from './schema/listings';
export * from './schema/events';
export * from './schema/passes';
export * from './schema/trails';
export * from './schema/itinerary';
export * from './schema/integrations';
export * from './schema/ads';
export * from './schema/i18n';
export * from './schema/map';
export * from './schema/kiosk-config';
