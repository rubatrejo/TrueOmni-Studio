'use client';

import { AdSlot, findSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * 2×2 — derivado del 3×2 `02-video-image-ad`.
 *
 * Composición:
 *   - Video hero 1×2 columna izquierda (col 0, full height).
 *   - Ad vertical 1×2 columna derecha (col 1, full height).
 */
function Render({ client, slots }: VideoWallTemplateRenderProps) {
  return (
    <>
      <VideoImageSlot
        client={client}
        rect={{ row: 0, col: 0, rowSpan: 2, colSpan: 1 }}
        module={findSlot(slots, 'video')}
      />
      <AdSlot
        client={client}
        rect={{ row: 0, col: 1, rowSpan: 2, colSpan: 1 }}
        module={findSlot(slots, 'ad')}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '05-video-image-ad',
  label: '05 · Video + Ad',
  category: 'composed',
  grid: '2x2',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      cellRect: { row: 0, col: 0, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'ad',
      kind: 'sidebar',
      cellRect: { row: 0, col: 1, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['ads'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
