'use client';

import { findSlot, SocialSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/**
 * 4×2 — derivado proporcional del 3×2 `05-video-image-social-wall`.
 *
 * Composición:
 *   - Video hero 3×2 izquierda (cols 0..2, full height).
 *   - Social wall 1×2 derecha (col 3) — grid 2×4 dentro de un TV.
 *
 * En 3×2 el social era 1×2 con 11 cards (3+4+4). Aquí el slot es más
 * estrecho (mismo ancho 1 col) pero misma altura, así que mantenemos
 * 8 cards en grid 2×4 (más cuadradas, menos comprimidas).
 */
function Render({ client, slots }: VideoWallTemplateRenderProps) {
  return (
    <>
      <VideoImageSlot
        client={client}
        rect={{ row: 0, col: 0, rowSpan: 2, colSpan: 3 }}
        module={findSlot(slots, 'video')}
      />
      <SocialSlot
        client={client}
        rect={{ row: 0, col: 3, rowSpan: 2, colSpan: 1 }}
        module={findSlot(slots, 'social')}
        cols={2}
        rows={4}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '05-video-image-social-wall',
  label: '05 · Video + Social Wall',
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
      key: 'social',
      kind: 'sidebar',
      cellRect: { row: 0, col: 3, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
