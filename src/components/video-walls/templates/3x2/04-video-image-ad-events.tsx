'use client';

import { AdSlot, EventsSlot, findSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/** 3×2 — video 2×2 izq + ad 1×1 top-der + events 1×1 (grid 3×1) bot-der. */
function Render({ client, slots }: VideoWallTemplateRenderProps) {
  return (
    <>
      <VideoImageSlot
        client={client}
        rect={{ row: 0, col: 0, rowSpan: 2, colSpan: 2 }}
        module={findSlot(slots, 'video')}
      />
      <AdSlot
        client={client}
        rect={{ row: 0, col: 2, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'ad')}
      />
      <EventsSlot
        client={client}
        rect={{ row: 1, col: 2, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'events')}
        cols={3}
        rows={1}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '04-video-image-ad-events',
  label: '04 · Video + Ad + Events',
  category: 'composed',
  grid: '3x2',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      cellRect: { row: 0, col: 0, rowSpan: 2, colSpan: 2 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'ad',
      kind: 'tile',
      cellRect: { row: 0, col: 2, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['ads'],
    },
    {
      key: 'events',
      kind: 'strip',
      cellRect: { row: 1, col: 2, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['events'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
