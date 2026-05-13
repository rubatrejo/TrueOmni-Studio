'use client';

import { findSlot, SocialSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * 2×2 — derivado del 3×2 `05-video-image-social-wall`.
 *
 * Composición:
 *   - Video hero 1×2 columna izquierda (col 0, full height).
 *   - Social wall 1×2 columna derecha (col 1) — grid 2×3 (6 cards).
 */
function Render({ client, slots }: VideoWallTemplateRenderProps) {
  return (
    <>
      <VideoImageSlot
        client={client}
        rect={{ row: 0, col: 0, rowSpan: 2, colSpan: 1 }}
        module={findSlot(slots, 'video')}
      />
      <SocialSlot
        client={client}
        rect={{ row: 0, col: 1, rowSpan: 2, colSpan: 1 }}
        module={findSlot(slots, 'social')}
        cols={2}
        rows={3}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '04-video-image-social-wall',
  label: '04 · Video + Social Wall',
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
      key: 'social',
      kind: 'sidebar',
      cellRect: { row: 0, col: 1, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
