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
  | 'billboard'
  | 'home-dashboard'
  | 'ai-avatar'
  | 'survey'
  | 'deals'
  | 'photo-booth'
  | 'digital-brochure'
  | 'social-wall'
  | 'guestbook'
  | 'listings'
  | 'events'
  | 'tickets'
  | 'passes'
  | 'trails'
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
  /**
   * Si la sección representa un módulo, qué key del `modules.systemModules`
   * controla su visibilidad. Si el toggle está OFF en la tab Modules, la
   * sección se dibuja en gris y no es clickable.
   */
  systemModuleKey?:
    | 'restaurants'
    | 'thingsToDo'
    | 'itineraryBuilder'
    | 'events'
    | 'passes'
    | 'tickets'
    | 'guestbook'
    | 'socialWall'
    | 'digitalBrochure'
    | 'map'
    | 'stay'
    | 'survey'
    | 'deals'
    | 'photoBooth'
    | 'trails'
    | 'wayfinding'
    | 'ads'
    | 'languages'
    | 'aiAvatar';
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
    title: 'Modules',
    description:
      'Master switches for every kiosk module. Modules turned off here disappear from Home Dashboard, AI Avatar, Languages, etc.',
    icon: 'ToggleRight',
    phase: 'S2',
  },
  {
    key: 'billboard',
    num: '03',
    label: 'Billboard',
    title: 'Billboard / Idle Screen',
    description:
      'Pick one of the 4 idle layouts and configure the inactivity timeout that returns visitors to it.',
    icon: 'MonitorPlay',
    phase: 'S2',
  },
  {
    key: 'home-dashboard',
    num: '04',
    label: 'Home Dashboard',
    title: 'Home Dashboard Tiles',
    description:
      'Reorder, rename and hide tiles inside the Home grid. Only modules enabled in the Modules tab show up here.',
    icon: 'LayoutGrid',
    phase: 'S2',
  },
  {
    key: 'ai-avatar',
    num: '05',
    label: 'AI Avatar',
    title: 'AI Avatar (Ask Anything)',
    description:
      'Configure the floating AI bubble: avatar image, greeting, suggested questions and Anthropic API.',
    icon: 'Sparkles',
    systemModuleKey: 'aiAvatar',
    phase: 'S2',
  },
  {
    key: 'survey',
    num: '06',
    label: 'Survey',
    title: 'Survey',
    description:
      'NPS, ratings and free-text questions shown as an overlay. Configure the funnel and contact capture.',
    icon: 'ClipboardList',
    systemModuleKey: 'survey',
    phase: 'S3',
  },
  {
    key: 'deals',
    num: '07',
    label: 'Deals',
    title: 'Deals & Promotions',
    description:
      'Upload deals, set expiration dates, codes and filters. Promotional offers shown to visitors.',
    icon: 'Tag',
    systemModuleKey: 'deals',
    phase: 'S3',
  },
  {
    key: 'photo-booth',
    num: '08',
    label: 'Photo Booth',
    title: 'Photo Booth',
    description:
      'Upload background scenes, frames and stickers for the green-screen capture experience.',
    icon: 'Camera',
    systemModuleKey: 'photoBooth',
    phase: 'S3',
  },
  {
    key: 'digital-brochure',
    num: '09',
    label: 'Digital Brochure',
    title: 'Digital Brochures',
    description:
      'Upload PDFs and configure the flippable brochure module shown on the kiosk.',
    icon: 'BookOpen',
    systemModuleKey: 'digitalBrochure',
    phase: 'S3',
  },
  {
    key: 'social-wall',
    num: '10',
    label: 'Social Wall',
    title: 'Social Wall',
    description:
      'Connect Instagram, TikTok, Facebook, X. Curate which feeds appear on the wall.',
    icon: 'Share2',
    systemModuleKey: 'socialWall',
    phase: 'S3',
  },
  {
    key: 'guestbook',
    num: '11',
    label: 'Guestbook',
    title: 'Guestbook',
    description:
      'Upload pins, customize the Earth zoom flow and curate the visitor messages displayed.',
    icon: 'PenSquare',
    systemModuleKey: 'guestbook',
    phase: 'S3',
  },
  {
    key: 'listings',
    num: '12',
    label: 'Listings',
    title: 'Listings (Restaurants / Things to Do / Stay)',
    description:
      'Bulk CRUD for the three listing catalogs: places to eat, things to do and stays.',
    icon: 'UtensilsCrossed',
    phase: 'S3',
  },
  {
    key: 'events',
    num: '13',
    label: 'Events',
    title: 'Events',
    description:
      'Calendar-based events with date, time, venue, ticket info and filters.',
    icon: 'Calendar',
    systemModuleKey: 'events',
    phase: 'S3',
  },
  {
    key: 'tickets',
    num: '14',
    label: 'Tickets',
    title: 'Tickets',
    description:
      'Wrapper derived from paid events. Configure visible categories, hero and copy.',
    icon: 'Ticket',
    systemModuleKey: 'tickets',
    phase: 'S3',
  },
  {
    key: 'passes',
    num: '15',
    label: 'Passes',
    title: 'Passes',
    description:
      'Bundles of activities sold via Bandwango. CRUD with cover, tagline and inline activities.',
    icon: 'TicketCheck',
    systemModuleKey: 'passes',
    phase: 'S3',
  },
  {
    key: 'trails',
    num: '16',
    label: 'Trails',
    title: 'Trails',
    description:
      'Hiking trails with considerations panel, GeoJSON path and difficulty/type filters.',
    icon: 'Footprints',
    systemModuleKey: 'trails',
    phase: 'S3',
  },
  {
    key: 'i18n',
    num: '17',
    label: 'Languages',
    title: 'Languages & Translations',
    description:
      'Editor for the 6 translations (EN/ES/FR/DE/PT/JA) with missing-key detection and AI-assisted translation.',
    icon: 'Languages',
    systemModuleKey: 'languages',
    phase: 'S4',
  },
  {
    key: 'ads',
    num: '18',
    label: 'Ads',
    title: 'Advertisements',
    description:
      'Upload, schedule and place ads (hero / bottom / popup) on specific kiosk screens.',
    icon: 'Megaphone',
    systemModuleKey: 'ads',
    phase: 'S5',
  },
  {
    key: 'integrations',
    num: '19',
    label: 'Integrations',
    title: 'Integrations & APIs',
    description:
      'Connect the weather widget, external POI/event APIs, Mapbox and Google Analytics.',
    icon: 'Plug',
    phase: 'S6',
  },
  {
    key: 'versions',
    num: '20',
    label: 'Versions',
    title: 'Versions & Changelog',
    description:
      'Immutable history of publishes, diffs between versions and auto-generated changelog entries.',
    icon: 'History',
    phase: 'S0',
  },
  {
    key: 'publish',
    num: '21',
    label: 'Publish',
    title: 'Publish & Approvals',
    description:
      'Request a publish to production. Final approval by ruben@trueomni.com.',
    icon: 'Rocket',
    phase: 'S7',
  },
];
