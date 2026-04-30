import type { ReactElement } from 'react';

import type { BillboardVariant } from '@/lib/studio/schema';

import { Wireframe0 } from './Wireframe0';
import { Wireframe1 } from './Wireframe1';
import { Wireframe2 } from './Wireframe2';
import { Wireframe3 } from './Wireframe3';

export { Wireframe0, Wireframe1, Wireframe2, Wireframe3 };

export const BILLBOARD_WIREFRAMES: Record<BillboardVariant, () => ReactElement> = {
  0: Wireframe0,
  1: Wireframe1,
  2: Wireframe2,
  3: Wireframe3,
};
