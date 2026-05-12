'use client';

import { EventsSlot, findSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/** 3×2 — video 2×2 izq + events grid 3×2 dentro de 1×2 der. */
function Render({ client, slots }: VideoWallTemplateRenderProps) {
  return (
    <>
      <VideoImageSlot
        client={client}
        rect={{ row: 0, col: 0, rowSpan: 2, colSpan: 2 }}
        module={findSlot(slots, 'video')}
      />
      <EventsSlot
        client={client}
        rect={{ row: 0, col: 2, rowSpan: 2, colSpan: 1 }}
        module={findSlot(slots, 'events')}
        cols={3}
        rows={2}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '03-video-image-events',
  label: '03 · Video + Events',
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
      key: 'events',
      kind: 'sidebar',
      cellRect: { row: 0, col: 2, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['events'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
