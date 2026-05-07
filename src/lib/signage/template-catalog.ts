import type { SignageModuleInstance, SignageModuleKind } from './schema';

/**
 * Descripción client-safe de los 8 templates signage (DSS5).
 *
 * El registry runtime (`src/components/signage/templates/registry.ts`)
 * carga los componentes Render con sus slots inline; este catalog es un
 * POJO ligero que sólo describe el shape de cada template, serializable y
 * sin imports de React. Permite que el editor del Studio configure slots
 * sin tener que cargar los SVG runtime.
 *
 * **Sync manual con los `SignageTemplate.slots` declarados en cada
 * `<NN-template>.tsx`.** Si añades un slot nuevo, edita aquí también. DSS5.5
 * podría auto-generar este catalog vía un script.
 */

export interface TemplateSlotDescriptor {
  key: string;
  kind: 'fullscreen' | 'hero' | 'sidebar' | 'strip' | 'tile';
  /** Rect a 1920×925 base (body region, sin header). */
  rect: { x: number; y: number; w: number; h: number };
  acceptedModules: SignageModuleKind[];
}

export interface TemplateDescriptor {
  id: string;
  label: string;
  category: 'fullscreen' | 'composed' | 'placeholder';
  slots: TemplateSlotDescriptor[];
}

export const SIGNAGE_TEMPLATES: readonly TemplateDescriptor[] = [
  {
    id: '01-full-events',
    label: '01 · Full Events',
    category: 'fullscreen',
    slots: [
      {
        key: 'main',
        kind: 'fullscreen',
        rect: { x: 0, y: 0, w: 1920, h: 925 },
        acceptedModules: ['events'],
      },
    ],
  },
  {
    id: '02-full-ad',
    label: '02 · Full Ad',
    category: 'fullscreen',
    slots: [
      {
        key: 'main',
        kind: 'fullscreen',
        rect: { x: 0, y: 0, w: 1920, h: 925 },
        acceptedModules: ['ads'],
      },
    ],
  },
  {
    id: '03-full-video-image',
    label: '03 · Full Video / Image',
    category: 'fullscreen',
    slots: [
      {
        key: 'main',
        kind: 'fullscreen',
        rect: { x: 0, y: 0, w: 1920, h: 925 },
        acceptedModules: ['video-image'],
      },
    ],
  },
  {
    id: '04-video-events-ad',
    label: '04 · Video + Events + Ad',
    category: 'composed',
    slots: [
      {
        key: 'video',
        kind: 'hero',
        rect: { x: 0, y: 0, w: 1145, h: 644 },
        acceptedModules: ['video-image'],
      },
      {
        key: 'ad',
        kind: 'strip',
        rect: { x: 0, y: 644, w: 1144, h: 281 },
        acceptedModules: ['ads'],
      },
      {
        key: 'events',
        kind: 'sidebar',
        rect: { x: 1145, y: 0, w: 775, h: 925 },
        acceptedModules: ['events'],
      },
    ],
  },
  {
    id: '05-video-2ads',
    label: '05 · Video + 2 Ads',
    category: 'composed',
    slots: [
      {
        key: 'video',
        kind: 'hero',
        rect: { x: 0, y: 0, w: 1144, h: 644 },
        acceptedModules: ['video-image'],
      },
      {
        key: 'right-ad',
        kind: 'sidebar',
        rect: { x: 1144, y: 0, w: 776, h: 925 },
        acceptedModules: ['ads'],
      },
      {
        key: 'bottom-ad',
        kind: 'strip',
        rect: { x: 0, y: 644, w: 1144, h: 281 },
        acceptedModules: ['ads'],
      },
    ],
  },
  {
    id: '06-video-news-ad',
    label: '06 · Video + News + Ad',
    category: 'composed',
    slots: [
      {
        key: 'video',
        kind: 'hero',
        rect: { x: 0, y: 0, w: 1144, h: 644 },
        acceptedModules: ['video-image'],
      },
      {
        key: 'right-ad',
        kind: 'sidebar',
        rect: { x: 1144, y: 0, w: 776, h: 925 },
        acceptedModules: ['ads'],
      },
      {
        key: 'news',
        kind: 'strip',
        rect: { x: 0, y: 644, w: 1144, h: 281 },
        acceptedModules: ['news'],
      },
    ],
  },
  {
    id: '07-video-social-ad',
    label: '07 · Video + Social + Ad',
    category: 'composed',
    slots: [
      {
        key: 'video',
        kind: 'hero',
        rect: { x: 0, y: 0, w: 1144, h: 644 },
        acceptedModules: ['video-image'],
      },
      {
        key: 'social',
        kind: 'sidebar',
        rect: { x: 1144, y: 0, w: 776, h: 925 },
        acceptedModules: ['social'],
      },
      {
        key: 'bottom-ad',
        kind: 'strip',
        rect: { x: 0, y: 644, w: 1144, h: 281 },
        acceptedModules: ['ads'],
      },
    ],
  },
  {
    id: '08-video-social',
    label: '08 · Video + Social',
    category: 'composed',
    slots: [
      {
        key: 'video',
        kind: 'hero',
        rect: { x: 0, y: 0, w: 1144, h: 925 },
        acceptedModules: ['video-image'],
      },
      {
        key: 'social',
        kind: 'sidebar',
        rect: { x: 1144, y: 0, w: 776, h: 925 },
        acceptedModules: ['social'],
      },
    ],
  },
] as const;

export function getTemplateDescriptor(id: string): TemplateDescriptor | null {
  return SIGNAGE_TEMPLATES.find((t) => t.id === id) ?? null;
}

/**
 * Devuelve una instancia mínima válida (defaults del schema Zod) para un kind
 * de module. Útil cuando el operador selecciona un module type para un slot
 * por primera vez.
 */
export function defaultModuleFor(kind: SignageModuleKind): SignageModuleInstance {
  switch (kind) {
    case 'events':
      return { kind: 'events', layout: 'hero-grid', maxItems: 5 };
    case 'social':
      return {
        kind: 'social',
        layout: 'grid-tweet',
        maxPosts: 6,
        rotationIntervalSec: 8,
      };
    case 'video-image':
      return {
        kind: 'video-image',
        asset: { url: '', kind: 'image' },
        loop: true,
        fit: 'cover',
      };
    case 'ads':
      return {
        kind: 'ads',
        asset: { url: '', kind: 'image' },
        weight: 1,
      };
    case 'news':
      return { kind: 'news', layout: 'icon-headline-body' };
    case 'weather':
      return { kind: 'weather', layout: 'compact' };
  }
}
