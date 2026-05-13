'use client';

import { EventsSlot, findSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * 2×1 strip — derivado del 3×2 `03-video-image-events`.
 *
 * Composición (header band continuo sobre las 2 cells lo pinta el runtime):
 *   - Video 1×1 izquierda (col 0).
 *   - Events 1×1 derecha (col 1) — grid 1×3 vertical para aprovechar
 *     la altura disponible bajo el header.
 */
function Render({ client, slots }: VideoWallTemplateRenderProps) {
  return (
    <>
      <VideoImageSlot
        client={client}
        rect={{ row: 0, col: 0, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'video')}
      />
      <EventsSlot
        client={client}
        rect={{ row: 0, col: 1, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'events')}
        cols={1}
        rows={3}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '03-video-image-events',
  label: '03 · Video + Events',
  category: 'composed',
  grid: '2x1',
  slots: [
    {
      key: 'video',
      kind: 'tile',
      cellRect: { row: 0, col: 0, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'events',
      kind: 'tile',
      cellRect: { row: 0, col: 1, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['events'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
