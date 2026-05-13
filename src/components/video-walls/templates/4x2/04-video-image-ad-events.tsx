'use client';

import { AdSlot, EventsSlot, findSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * 4×2 — derivado proporcional del 3×2 `04-video-image-ad-events`.
 *
 * Composición:
 *   - Video hero 3×2 izquierda (cols 0..2, full height).
 *   - Ad 1×1 esquina superior derecha (col 3, row 0).
 *   - Events 1×1 esquina inferior derecha (col 3, row 1) — grid 1×3.
 *
 * La 4ta columna gana más respiro vs 3×2: el ad y los events ocupan
 * cada uno un TV completo (1920×1080) en lugar de medio.
 */
function Render({ client, slots }: VideoWallTemplateRenderProps) {
  return (
    <>
      <VideoImageSlot
        client={client}
        rect={{ row: 0, col: 0, rowSpan: 2, colSpan: 3 }}
        module={findSlot(slots, 'video')}
      />
      <AdSlot
        client={client}
        rect={{ row: 0, col: 3, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'ad')}
      />
      <EventsSlot
        client={client}
        rect={{ row: 1, col: 3, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'events')}
        cols={1}
        rows={3}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '04-video-image-ad-events',
  label: '04 · Video + Ad + Events',
  category: 'composed',
  grid: '4x2',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      cellRect: { row: 0, col: 0, rowSpan: 2, colSpan: 3 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'ad',
      kind: 'tile',
      cellRect: { row: 0, col: 3, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['ads'],
    },
    {
      key: 'events',
      kind: 'strip',
      cellRect: { row: 1, col: 3, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['events'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
