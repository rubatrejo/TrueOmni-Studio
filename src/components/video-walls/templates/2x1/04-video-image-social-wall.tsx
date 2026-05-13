'use client';

import { findSlot, SocialSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * 2×1 strip — derivado del 3×2 `05-video-image-social-wall`.
 *
 * Composición:
 *   - Video 1×1 izquierda (col 0).
 *   - Social wall 1×1 derecha (col 1) — grid 1×3 vertical (3 cards
 *     apiladas) para coherencia con el `03-events` del mismo grid.
 *     Aunque el TV es landscape, una columna estrecha de 3 posts es
 *     más legible a distancia que un grid 2×2 comprimido.
 */
function Render({ client, slots }: VideoWallTemplateRenderProps) {
  return (
    <>
      <VideoImageSlot
        client={client}
        rect={{ row: 0, col: 0, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'video')}
      />
      <SocialSlot
        client={client}
        rect={{ row: 0, col: 1, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'social')}
        cols={1}
        rows={3}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '04-video-image-social-wall',
  label: '04 · Video + Social Wall',
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
