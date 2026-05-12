'use client';

import { AdSlot, findSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/** 3×2 template — video 2×2 izq + ad vertical 1×2 der. */
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
        rect={{ row: 0, col: 2, rowSpan: 2, colSpan: 1 }}
        module={findSlot(slots, 'ad')}
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '02-video-image-ad',
  label: '02 · Video + Ad',
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
      kind: 'sidebar',
      cellRect: { row: 0, col: 2, rowSpan: 2, colSpan: 1 },
      acceptedModules: ['ads'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
