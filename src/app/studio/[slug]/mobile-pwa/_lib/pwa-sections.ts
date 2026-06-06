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
  | 'profile'
  | 'notifications'
  | 'more'
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
    key: 'profile',
    num: '11',
    label: 'Profile',
    title: 'Profile & Account',
    description:
      'White-label texts of the profile, edit, settings, change-password and delete-account screens.',
    icon: 'UserCircle',
    phase: 'P2',
  },
  {
    key: 'notifications',
    num: '12',
    label: 'Notifications',
    title: 'Notifications',
    description:
      'Texts of the notifications list, selection mode, delete confirmation and empty state.',
    icon: 'Bell',
    phase: 'P2',
  },
  {
    key: 'more',
    num: '13',
    label: 'More',
    title: 'More Menu',
    description:
      'Search placeholder, weather line and the labels / order of the More menu entries.',
    icon: 'MoreHorizontal',
    phase: 'P2',
  },
  {
    key: 'publish',
    num: '14',
    label: 'Publish',
    title: 'Publish & Approvals',
    description:
      'Publish the PWA configuration to production. Opens a dedicated PR and triggers a Vercel redeploy.',
    icon: 'Rocket',
    phase: 'P1',
  },
];
