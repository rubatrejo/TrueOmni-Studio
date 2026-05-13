'use client';

import { AdSlot, findSlot, SocialSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * 4×2 — derivado proporcional del 3×2 `06-video-image-ad-social-wall`.
 *
 * Composición:
 *   - Video hero 3×2 izquierda (cols 0..2, full height).
 *   - Ad 1×1 esquina superior derecha (col 3, row 0).
 *   - Social wall 1×1 inferior derecha (col 3, row 1) — grid 2×2.
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
      <SocialSlot
        client={client}
        rect={{ row: 1, col: 3, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'social')}
        cols={2}
        rows={2}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '06-video-image-ad-social-wall',
  label: '06 · Video + Ad + Social Wall',
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
      key: 'social',
      kind: 'tile',
      cellRect: { row: 1, col: 3, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
