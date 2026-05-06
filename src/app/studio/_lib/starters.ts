/**
 * Starter templates — Fase 9 del roadmap original.
 *
 * Cada starter define un punto de partida realista para crear un kiosk
 * nuevo: paleta + fonts + módulos sugeridos + tono del Ask AI. El operador
 * clica "Use template" en NewClientModal y los overrides se aplican
 * automáticamente al kiosk recién creado.
 *
 * Los IDs de paleta corresponden a `PRESET_PALETTES` de
 * `src/app/studio/_components/EditorPanel.tsx`.
 */

import type { SystemModules } from '@/lib/studio/schema';

export interface Starter {
  id: string;
  label: string;
  description: string;
  /** Paleta de color base. Debe coincidir con un preset de EditorPanel. */
  paletteId: 'TrueOmni' | 'Arizona' | 'Hotel Beach' | 'Forest' | 'Mono';
  fonts: {
    display: string;
    body: string;
  };
  /**
   * Módulos sugeridos del Home dashboard. Si una key no está aquí, queda
   * en su default del schema. El operador puede toggle después.
   */
  defaultModules: Partial<Record<keyof SystemModules, boolean>>;
  /** Tone hint para el system prompt del Ask AI. Sutil — Claude lo combina con el contexto del kiosk. */
  aiTone: string;
  /** Sugerencias para `home.askAi.suggestedQuestions` (texto inicial; el operador edita). */
  aiSuggestedQuestions: string[];
}

export const STARTERS: readonly Starter[] = [
  {
    id: 'boutique-hotel',
    label: 'Boutique Hotel',
    description:
      'Lobby kiosk for upscale hotels — front-desk supplement focused on dining, local discoveries and trip planning.',
    paletteId: 'Hotel Beach',
    fonts: {
      display: 'Playfair Display',
      body: 'Inter',
    },
    defaultModules: {
      restaurants: true,
      thingsToDo: true,
      itineraryBuilder: true,
      aiAvatar: true,
      events: true,
      tickets: true,
      photoBooth: false,
      trails: false,
      socialWall: false,
      guestbook: true,
      digitalBrochure: true,
      ads: false,
    },
    aiTone:
      'Concierge-style. Calm, refined, anticipates needs. Mentions the in-house concierge desk for things outside the kiosk scope.',
    aiSuggestedQuestions: [
      'Where can we have dinner tonight?',
      'What is there to do tomorrow morning?',
      'How far is it to the nearest beach?',
      'Where can I print my boarding pass?',
    ],
  },
  {
    id: 'dmo-state',
    label: 'DMO Statewide',
    description:
      'Visitor center kiosk for state/regional DMOs — broad coverage of attractions, events and trails across the destination.',
    paletteId: 'TrueOmni',
    fonts: {
      display: 'Outfit',
      body: 'Inter',
    },
    defaultModules: {
      restaurants: true,
      thingsToDo: true,
      stay: true,
      events: true,
      trails: true,
      socialWall: true,
      itineraryBuilder: true,
      aiAvatar: true,
      digitalBrochure: true,
      passes: true,
      tickets: true,
      photoBooth: true,
      guestbook: true,
      ads: true,
    },
    aiTone:
      'Welcoming travel guide. Highlights iconic spots first, then off-the-beaten-path. Tells visitors where the visitor center desk is for printed maps.',
    aiSuggestedQuestions: [
      'What are the must-see places this weekend?',
      'Can you suggest a 2-day itinerary?',
      'Where can I see live music tonight?',
      'Are there any free events today?',
    ],
  },
  {
    id: 'resort-tropical',
    label: 'Resort / Tropical',
    description:
      'Beach resort kiosk — heavy on photo booth, social wall, in-property tickets and excursions. Outdoor-leaning.',
    paletteId: 'Forest',
    fonts: {
      display: 'Cormorant Garamond',
      body: 'Inter',
    },
    defaultModules: {
      restaurants: true,
      thingsToDo: true,
      tickets: true,
      photoBooth: true,
      socialWall: true,
      events: true,
      aiAvatar: true,
      itineraryBuilder: true,
      trails: true,
      guestbook: true,
      digitalBrochure: false,
      stay: false,
      passes: false,
      ads: false,
    },
    aiTone:
      'Easy-going vacation host. Mentions excursion times, sunset spots and pool/beach hours. Suggests checking with the activities desk for bookings.',
    aiSuggestedQuestions: [
      'When is sunset tonight?',
      "What's the best snorkeling spot?",
      'Can you recommend a romantic dinner?',
      'How do I book the catamaran tour?',
    ],
  },
  {
    id: 'urban-attraction',
    label: 'Urban Attraction',
    description:
      'Museum, theme park, or downtown landmark kiosk — ticket-first flow with map and ads for ancillary partners.',
    paletteId: 'Mono',
    fonts: {
      display: 'Space Grotesk',
      body: 'Inter',
    },
    defaultModules: {
      tickets: true,
      passes: true,
      events: true,
      ads: true,
      photoBooth: true,
      aiAvatar: true,
      digitalBrochure: true,
      thingsToDo: true,
      socialWall: true,
      itineraryBuilder: false,
      restaurants: false,
      stay: false,
      trails: false,
      guestbook: false,
    },
    aiTone:
      'Direct, informative. Helps with wayfinding inside the venue, ticket types, and timing. Refers to the box office for refund/exchange questions.',
    aiSuggestedQuestions: [
      'What time does the venue close?',
      'Where do I exchange my pass?',
      'Is there a coat check?',
      "What's playing right now?",
    ],
  },
];

export function findStarter(id: string): Starter | undefined {
  return STARTERS.find((s) => s.id === id);
}
