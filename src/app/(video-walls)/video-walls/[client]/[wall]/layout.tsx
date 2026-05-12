import type { ReactNode } from 'react';

/**
 * Layout del runtime video-walls. Nuke todos los chromes del Studio
 * (header, footer, padding) — la URL sirve a un TV físico, no a un
 * navegador con UI. Body inset-0 negro full-bleed.
 */
export default function VideoWallLayout({ children }: { children: ReactNode }) {
  return <div className="fixed inset-0 overflow-hidden bg-black">{children}</div>;
}
