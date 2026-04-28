/**
 * Definición de las pestañas del Studio.
 *
 * Cada pestaña corresponde a una sección del KioskConfig:
 *  - branding   → 3 brand tokens + logos + fonts
 *  - modules    → toggle/reorder/labels de los 13 módulos del kiosk
 *  - content    → CRUD de listings/events/passes/deals/trails/brochures
 *  - i18n       → 6 archivos de traducción
 *  - ads        → subir, calendarizar, emplazar anuncios
 *  - integrations → clima, APIs, Mapbox, Analytics
 *  - versions   → histórico + rollback + changelog
 *  - publish    → request publish + approval queue
 */

export type StudioSectionKey =
  | 'branding'
  | 'modules'
  | 'content'
  | 'i18n'
  | 'ads'
  | 'integrations'
  | 'versions'
  | 'publish';

export type StudioSection = {
  key: StudioSectionKey;
  num: string;
  label: string;
  title: string;
  description: string;
  /** Glyph SVG path o nombre de icono Lucide a renderizar en la sidebar. */
  icon: string;
  /** Si la sección requiere features.* habilitadas. */
  requiresModule?: string;
  /** Fase del roadmap del Studio en la que se entrega. */
  phase: 'S0' | 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7';
};

export const STUDIO_SECTIONS: StudioSection[] = [
  {
    key: 'branding',
    num: '01',
    label: 'Branding',
    title: 'Branding & Identity',
    description:
      'The 3 brand tokens (primary / secondary / tertiary), logos, favicon and typography.',
    icon: 'Palette',
    phase: 'S1',
  },
  {
    key: 'modules',
    num: '02',
    label: 'Modules',
    title: 'Kiosk Modules',
    description:
      'Toggle the 13 kiosk modules on or off, reorder Home tiles and edit their labels.',
    icon: 'LayoutGrid',
    phase: 'S2',
  },
  {
    key: 'content',
    num: '03',
    label: 'Content',
    title: 'Content & Data',
    description:
      'Catalogs for listings, events, tickets, passes, deals, trails and brochures with bulk CRUD.',
    icon: 'Database',
    phase: 'S3',
  },
  {
    key: 'i18n',
    num: '04',
    label: 'Languages',
    title: 'Languages & Translations',
    description:
      'Editor for the 6 translations (EN/ES/FR/DE/PT/JA) with missing-key detection and AI-assisted translation.',
    icon: 'Languages',
    phase: 'S4',
  },
  {
    key: 'ads',
    num: '05',
    label: 'Ads',
    title: 'Advertisements',
    description:
      'Upload, schedule and place ads (hero / bottom / popup) on specific kiosk screens.',
    icon: 'Megaphone',
    phase: 'S5',
  },
  {
    key: 'integrations',
    num: '06',
    label: 'Integrations',
    title: 'Integrations & APIs',
    description:
      'Connect the weather widget, external POI/event APIs, Mapbox and Google Analytics.',
    icon: 'Plug',
    phase: 'S6',
  },
  {
    key: 'versions',
    num: '07',
    label: 'Versions',
    title: 'Versions & Changelog',
    description:
      'Immutable history of publishes, diffs between versions and auto-generated changelog entries.',
    icon: 'History',
    phase: 'S0',
  },
  {
    key: 'publish',
    num: '08',
    label: 'Publish',
    title: 'Publish & Approvals',
    description:
      'Request a publish to production. Final approval by ruben@trueomni.com.',
    icon: 'Rocket',
    phase: 'S7',
  },
];
