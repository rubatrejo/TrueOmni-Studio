'use client';

import { AdSlot, findSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

/** 1×2 portrait stack — video top + ad bottom. */
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
      />
    </>
  );
}

const Template: VideoWallTemplate = {
  id: '02-video-ad-stack',
  label: '02 · Video + Ad (stacked)',
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
  ],
  Render,
};

registerTemplate(Template);
export default Template;
