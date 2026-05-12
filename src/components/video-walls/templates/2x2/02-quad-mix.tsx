'use client';

import {
  AdSlot,
  EventsSlot,
  findSlot,
  SocialSlot,
  VideoImageSlot,
} from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/** 2×2 — 4 cells = 4 módulos independientes (video / ad / events / social). */
function Render({ client, slots }: VideoWallTemplateRenderProps) {
  return (
    <>
      <VideoImageSlot
        client={client}
        rect={{ row: 0, col: 0, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'video')}
      />
      <AdSlot
        client={client}
        rect={{ row: 0, col: 1, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'ad')}
      />
      <EventsSlot
        client={client}
        rect={{ row: 1, col: 0, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'events')}
        cols={2}
        rows={2}
      />
      <SocialSlot
        client={client}
        rect={{ row: 1, col: 1, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'social')}
        cols={2}
        rows={2}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '02-quad-mix',
  label: '02 · Quad Mix',
  category: 'composed',
  grid: '2x2',
  slots: [
    {
      key: 'video',
      kind: 'tile',
      cellRect: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'ad',
      kind: 'tile',
      cellRect: { row: 0, col: 1, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['ads'],
    },
    {
      key: 'events',
      kind: 'tile',
      cellRect: { row: 1, col: 0, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['events'],
    },
    {
      key: 'social',
      kind: 'tile',
      cellRect: { row: 1, col: 1, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
