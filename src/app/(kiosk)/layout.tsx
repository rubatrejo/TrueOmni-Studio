import type { ReactNode } from 'react';

import { KioskCanvas } from '@/components/kiosk-canvas';

export default function KioskLayout({ children }: { children: ReactNode }) {
  return <KioskCanvas>{children}</KioskCanvas>;
}
