'use client';

import { EventsSlot, findSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * 1×2 portrait stack — derivado del 3×2 `03-video-image-events`.
 *
 * Composición (header band en cell (0,0) lo pinta el runtime):
 *   - Video 1×1 cell superior (col 0, row 0).
 *   - Events 1×1 cell inferior (col 0, row 1) — grid 1×3 vertical
 *     (3 cards apiladas) para una columna estrecha.
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
        rect={{ row: 1, col: 0, rowSpan: 1, colSpan: 1 }}
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
  grid: '1x2',
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
      cellRect: { row: 1, col: 0, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['events'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
