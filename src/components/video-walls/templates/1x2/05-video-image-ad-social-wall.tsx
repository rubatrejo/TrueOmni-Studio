'use client';

import { AdSlot, findSlot, SocialSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * 1×2 portrait stack — derivado del 3×2 `06-video-image-ad-social-wall`.
 *
 * Cell inferior (1,0) se parte en dos sub-cells (ad arriba / social
 * abajo) vía `pxOverride`. La cell inferior es 1920×1080 completos
 * (no le aplica header recorte porque row=1), partimos 50/50 →
 * 540px ad, 540px social.
 *
 * Composición:
 *   - Video 1×1 cell superior (col 0, row 0).
 *   - Ad sub-cell superior dentro de cell (1,0).
 *   - Social wall sub-cell inferior dentro de cell (1,0) — grid 2×1.
 */
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
        rect={{ row: 1, col: 0, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'ad')}
        pxOverride={{ x: 0, y: 1080, w: 1920, h: 540 }}
      />
      <SocialSlot
        client={client}
        rect={{ row: 1, col: 0, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'social')}
        cols={2}
        rows={1}
        pxOverride={{ x: 0, y: 1620, w: 1920, h: 540 }}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '05-video-image-ad-social-wall',
  label: '05 · Video + Ad + Social Wall',
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
      key: 'ad',
      kind: 'tile',
      cellRect: { row: 1, col: 0, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['ads'],
    },
    {
      key: 'social',
      kind: 'tile',
      cellRect: { row: 1, col: 0, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
