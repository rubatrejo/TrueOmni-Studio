'use client';

import { findSlot, SocialSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/** 4×2 — video 3×2 izq + social grid 4×3 dentro 1×2 der. */
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
        cols={4}
        rows={3}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '03-video-image-social',
  label: '03 · Video + Social Wall',
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
