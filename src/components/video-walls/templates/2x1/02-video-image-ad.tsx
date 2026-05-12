'use client';

import { AdSlot, findSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/** 2×1 strip — video 1×1 izq + ad 1×1 der. */
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
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '02-video-image-ad',
  label: '02 · Video + Ad',
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
  ],
  Render,
};

registerTemplate(Template);
export default Template;
