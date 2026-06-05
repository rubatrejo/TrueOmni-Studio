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
  | 'modules'
  | 'scavenger-hunt'
  | 'wayfinding'
  | 'trip-planner'
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
    key: 'modules',
    num: '02',
    label: 'Modules',
    title: 'Modules & Navigation',
    description:
      'Show, hide, reorder and rename the dashboard tiles and bottom-nav entries of the mobile app.',
    icon: 'LayoutGrid',
    phase: 'P1',
  },
  {
    key: 'scavenger-hunt',
    num: '03',
    label: 'Scavenger Hunt',
    title: 'Scavenger Hunt',
    description:
      'PWA-only gamification: hunts with photo / check-in / trivia tasks, coordinates and rewards.',
    icon: 'Trophy',
    phase: 'P1',
  },
  {
    key: 'wayfinding',
    num: '04',
    label: 'Wayfinding',
    title: 'Wayfinding',
    description:
      'PWA-only indoor navigation: floor plans, amenities, routes and step-by-step directions.',
    icon: 'Compass',
    phase: 'P1',
  },
  {
    key: 'trip-planner',
    num: '05',
    label: 'Trip Planner',
    title: 'Trip Planner',
    description:
      'Mobile labels for the Trip Planner (the AI itinerary content is inherited from the kiosk).',
    icon: 'Route',
    phase: 'P1',
  },
  {
    key: 'publish',
    num: '06',
    label: 'Publish',
    title: 'Publish & Approvals',
    description:
      'Publish the PWA configuration to production. Opens a dedicated PR and triggers a Vercel redeploy.',
    icon: 'Rocket',
    phase: 'P1',
  },
];
