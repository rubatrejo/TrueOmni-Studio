'use client';

import { AdSlot, findSlot, SocialSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * 2×1 strip — derivado del 3×2 `06-video-image-ad-social-wall`.
 *
 * Como la grid solo tiene 2 cells y necesitamos 3 slots, partimos la
 * cell derecha en dos (ad arriba / social abajo) usando `pxOverride`.
 * La zona visible de la cell derecha bajo el header (335px) son 745px
 * de alto; partimos ~50/50 → 372px ad, 373px social.
 *
 * Composición:
 *   - Video 1×1 izquierda (col 0).
 *   - Ad sub-cell superior derecha.
 *   - Social wall sub-cell inferior derecha (grid 1×2).
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
        rect={{ row: 0, col: 1, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'ad')}
        pxOverride={{ x: 1920, y: 335, w: 1920, h: 372 }}
      />
      <SocialSlot
        client={client}
        rect={{ row: 0, col: 1, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'social')}
        cols={2}
        rows={1}
        pxOverride={{ x: 1920, y: 707, w: 1920, h: 373 }}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '05-video-image-ad-social-wall',
  label: '05 · Video + Ad + Social Wall',
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
      key: 'ad',
      kind: 'tile',
      cellRect: { row: 0, col: 1, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['ads'],
    },
    {
      key: 'social',
      kind: 'tile',
      cellRect: { row: 0, col: 1, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
