'use client';

import { findSlot, VideoImageSlot } from '../_shared/slot-renderers';
import { registerTemplate } from '../registry';
import type { VideoWallTemplate, VideoWallTemplateRenderProps } from '../types';

function Render({ client, slots }: VideoWallTemplateRenderProps) {
  return (
    <VideoImageSlot
      client={client}
      rect={{ row: 0, col: 0, rowSpan: 1, colSpan: 2 }}
      module={findSlot(slots, 'main')}
    />
  );
}

const Template: VideoWallTemplate = {
  id: '01-video-image-full',
  label: '01 · Full Video / Image',
  category: 'fullscreen',
  grid: '2x1',
  slots: [
    {
      key: 'main',
      kind: 'fullscreen',
      cellRect: { row: 0, col: 0, rowSpan: 1, colSpan: 2 },
      acceptedModules: ['video-image'],
    },
  ],
  Render,
};

registerTemplate(Template);
export default Template;
