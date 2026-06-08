/**
 * Secciones del editor PWA del Studio.
 *
 * Paralelo a `_lib/sections.ts` (kiosk) pero con el contenido configurable de
 * la PWA. Reutiliza el chasis visual del kiosk (`SidebarTabs`, etc.) vía el
 * tipo genérico `SidebarSectionLike`.
 *
 * Fase 1 (esencial): Branding, Módulos, y los 3 módulos PWA-only con data
 * propia (Scavenger Hunt, Wayfinding, Trip Planner) + Publish. El resto de
 * secciones (welcome/login/dashboard/perfil/textos de módulos heredados) llega
 * en la Fase 2.
 */

import type { SidebarSectionLike } from '../../../_components/SidebarTabs';

export type PwaSectionKey =
  | 'branding'
  | 'welcome'
  | 'login'
  | 'modules'
  | 'scavenger-hunt'
  | 'wayfinding'
  | 'trip-planner'
  | 'restaurants'
  | 'stay'
  | 'things-to-do'
  | 'trails'
  | 'events'
  | 'tickets'
  | 'deals'
  | 'passes'
  | 'map'
  | 'digital-brochure'
  | 'social-wall'
  | 'profile'
  | 'notifications'
  | 'more'
  | 'connect-with-us'
  | 'help'
  | 'search'
  | 'create-account'
  | 'forgot-password'
  | 'ads'
  | 'languages'
  | 'publish';

export type PwaSection = SidebarSectionLike<PwaSectionKey> & {
  num: string;
  description: string;
  /** Fase del roadmap PWA en la que se entrega. */
  phase: 'P1' | 'P2';
};

export const PWA_SECTIONS: readonly PwaSection[] = [
  {
    key: 'branding',
    num: '01',
    label: 'Branding',
    title: 'Branding & Identity',
    description:
      'Brand colors, logo and typography. Shared with the kiosk — editing here updates every product for this client.',
    icon: 'Palette',
    phase: 'P1',
  },
  {
    key: 'welcome',
    num: '02',
    label: 'Welcome',
    title: 'Welcome Splash',
    description:
      'Arrival screen of the mobile app: fullscreen background and how long it shows before moving to Login.',
    icon: 'Sparkles',
    phase: 'P2',
  },
  {
    key: 'login',
    num: '03',
    label: 'Login',
    title: 'Login & Sign In',
    description:
      'Background, form labels and buttons of the login screen, plus the texts of the login error dialog.',
    icon: 'LogIn',
    phase: 'P2',
  },
  {
    key: 'modules',
    num: '04',
    label: 'Modules',
    title: 'Modules & Navigation',
    description:
      'Show, hide, reorder and rename the dashboard tiles and bottom-nav entries of the mobile app.',
    icon: 'LayoutGrid',
    phase: 'P1',
  },
  {
    key: 'scavenger-hunt',
    num: '05',
    label: 'Scavenger Hunt',
    title: 'Scavenger Hunt',
    description:
      'PWA-only gamification: hunts with photo / check-in / trivia tasks, coordinates and rewards.',
    icon: 'Trophy',
    phase: 'P1',
  },
  {
    key: 'wayfinding',
    num: '06',
    label: 'Wayfinding',
    title: 'Wayfinding',
    description:
      'PWA-only indoor navigation: floor plans, amenities, routes and step-by-step directions.',
    icon: 'Compass',
    phase: 'P1',
  },
  {
    key: 'trip-planner',
    num: '07',
    label: 'Trip Planner',
    title: 'Trip Planner',
    description:
      'Mobile labels for the Trip Planner (the AI itinerary content is inherited from the kiosk).',
    icon: 'Route',
    phase: 'P1',
  },
  {
    key: 'restaurants',
    num: '08',
    label: 'Restaurants',
    title: 'Restaurants',
    description:
      'White-label texts of the Restaurants module (grid, list, filters and detail screens).',
    icon: 'UtensilsCrossed',
    phase: 'P2',
  },
  {
    key: 'stay',
    num: '09',
    label: 'Places to Stay',
    title: 'Places to Stay',
    description:
      'White-label texts of the Places to Stay module (grid, list, filters and detail screens).',
    icon: 'BookOpen',
    phase: 'P2',
  },
  {
    key: 'things-to-do',
    num: '10',
    label: 'Things to Do',
    title: 'Things to Do',
    description:
      'White-label texts of the Things to Do module (grid, list, filters and detail screens).',
    icon: 'Compass',
    phase: 'P2',
  },
  {
    key: 'trails',
    num: '11',
    label: 'Trails',
    title: 'Trails',
    description:
      'White-label texts of the Trails module (grid, list, filters, the detail screen and its Considerations panel).',
    icon: 'Footprints',
    phase: 'P2',
  },
  {
    key: 'events',
    num: '12',
    label: 'Events',
    title: 'Events',
    description:
      'White-label texts of the events timeline, filters and detail screen of the mobile app.',
    icon: 'Calendar',
    phase: 'P2',
  },
  {
    key: 'tickets',
    num: '13',
    label: 'Tickets',
    title: 'Tickets',
    description:
      'White-label texts of the tickets timeline, filters and detail screen (buy-ticket CTA).',
    icon: 'Ticket',
    phase: 'P2',
  },
  {
    key: 'deals',
    num: '14',
    label: 'Deals',
    title: 'Deals',
    description:
      'White-label texts of the deals grid, sort / filter overlays and the redeem sheet.',
    icon: 'Tag',
    phase: 'P2',
  },
  {
    key: 'passes',
    num: '15',
    label: 'Passes',
    title: 'Passes',
    description: 'White-label texts of the passes grid and detail screen of the mobile app.',
    icon: 'TicketCheck',
    phase: 'P2',
  },
  {
    key: 'map',
    num: '16',
    label: 'Map',
    title: 'Map',
    description:
      'White-label texts of the aggregated map (tabs, results, filters) and category chip labels.',
    icon: 'MapPin',
    phase: 'P2',
  },
  {
    key: 'digital-brochure',
    num: '17',
    label: 'Digital Brochure',
    title: 'Digital Brochure',
    description: 'White-label texts of the brochures list and the PDF reader of the mobile app.',
    icon: 'BookOpen',
    phase: 'P2',
  },
  {
    key: 'social-wall',
    num: '18',
    label: 'Social Wall',
    title: 'Social Wall',
    description: 'White-label texts of the social wall (title, tabs and highlights row).',
    icon: 'Share2',
    phase: 'P2',
  },
  {
    key: 'profile',
    num: '19',
    label: 'Profile',
    title: 'Profile & Account',
    description:
      'White-label texts of the profile, edit, settings, change-password and delete-account screens.',
    icon: 'UserCircle',
    phase: 'P2',
  },
  {
    key: 'notifications',
    num: '20',
    label: 'Notifications',
    title: 'Notifications',
    description:
      'Texts of the notifications list, selection mode, delete confirmation and empty state.',
    icon: 'Bell',
    phase: 'P2',
  },
  {
    key: 'more',
    num: '21',
    label: 'More',
    title: 'More Menu',
    description:
      'Search placeholder, weather line and the labels / order of the More menu entries.',
    icon: 'MoreHorizontal',
    phase: 'P2',
  },
  {
    key: 'connect-with-us',
    num: '22',
    label: 'Connect With Us',
    title: 'Connect With Us',
    description:
      'Contact details and texts of the Connect With Us screen (socials, phone, website, address, hours).',
    icon: 'Smartphone',
    phase: 'P2',
  },
  {
    key: 'help',
    num: '23',
    label: 'Help',
    title: 'Help',
    description:
      'White-label texts of the help center: landing, article feedback and the contact screen.',
    icon: 'ClipboardList',
    phase: 'P2',
  },
  {
    key: 'search',
    num: '24',
    label: 'Search',
    title: 'Search',
    description: 'Placeholder, headings and result-type labels of the search screen.',
    icon: 'Compass',
    phase: 'P2',
  },
  {
    key: 'create-account',
    num: '25',
    label: 'Create Account',
    title: 'Create Account',
    description:
      'Texts of the sign-up flow: the form, the validation dialog and the upload-photo step.',
    icon: 'PenSquare',
    phase: 'P2',
  },
  {
    key: 'forgot-password',
    num: '26',
    label: 'Forgot Password',
    title: 'Forgot Password',
    description: 'Texts of the forgot-password flow: the email step and the confirmation screen.',
    icon: 'Lock',
    phase: 'P2',
  },
  {
    key: 'ads',
    num: '27',
    label: 'Ads',
    title: 'Ads',
    description:
      'Hero, bottom-banner and popup ads of the mobile app, placed by /pwa route with mobile-sized assets.',
    icon: 'Megaphone',
    phase: 'P2',
  },
  {
    key: 'languages',
    num: '28',
    label: 'Languages',
    title: 'Languages',
    description:
      'Translate the mobile app texts to each language (AI-assisted). Applied at runtime when the user switches language.',
    icon: 'Languages',
    phase: 'P2',
  },
  {
    key: 'publish',
    num: '29',
    label: 'Publish',
    title: 'Publish & Approvals',
    description:
      'Publish the PWA configuration to production. Opens a dedicated PR and triggers a Vercel redeploy.',
    icon: 'Rocket',
    phase: 'P1',
  },
];
