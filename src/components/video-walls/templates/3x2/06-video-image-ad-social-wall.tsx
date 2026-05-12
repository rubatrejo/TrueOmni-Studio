'use client';

import { AdSlot, findSlot, SocialSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/** 3×2 — video 2×2 izq + ad 1×1 top-der + social 1×1 (grid 3×3) bot-der. */
function Render({ client, slots }: VideoWallTemplateRenderProps) {
  return (
    <>
      <VideoImageSlot
        client={client}
        rect={{ row: 0, col: 0, rowSpan: 2, colSpan: 2 }}
        module={findSlot(slots, 'video')}
      />
      <AdSlot
        client={client}
        rect={{ row: 0, col: 2, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'ad')}
      />
      <SocialSlot
        client={client}
        rect={{ row: 1, col: 2, rowSpan: 1, colSpan: 1 }}
        module={findSlot(slots, 'social')}
        cols={3}
        rows={3}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '06-video-image-ad-social-wall',
  label: '06 · Video + Ad + Social Wall',
  category: 'composed',
  grid: '3x2',
  slots: [
    {
      key: 'video',
      kind: 'hero',
      cellRect: { row: 0, col: 0, rowSpan: 2, colSpan: 2 },
      acceptedModules: ['video-image'],
    },
    {
      key: 'ad',
      kind: 'tile',
      cellRect: { row: 0, col: 2, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['ads'],
    },
    {
      key: 'social',
      kind: 'tile',
      cellRect: { row: 1, col: 2, rowSpan: 1, colSpan: 1 },
      acceptedModules: ['social'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
