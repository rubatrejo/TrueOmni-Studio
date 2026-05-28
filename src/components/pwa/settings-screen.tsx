'use client';

import { useRouter } from 'next/navigation';

import { InLayerNav } from './in-layer-nav';
import { S } from './mobile-layer';
import { PwaSubHeader } from './pwa-sub-header';

const OPEN_SANS = { fontFamily: 'var(--font-open-sans)' } as const;

/**
 * Settings (`/pwa/profile/settings`) — pantalla 6. Fondo blanco, header con "Back" +
 * "Settings", una fila "Delete my Account" → flujo de borrado, y bottom nav.
 */
export function SettingsScreen({ title, deleteRow }: { title: string; deleteRow: string }) {
  const router = useRouter();
  return (
    <div className="relative h-full w-full overflow-hidden bg-background">
      <div
        className="absolute left-0 top-0"
        style={{ width: 375, height: 812, transform: `scale(${S})`, transformOrigin: 'top left' }}
      >
        <PwaSubHeader title={title} backLabel="Back" backHref="/pwa/profile/edit" />

        <button
          type="button"
          onClick={() => router.push('/pwa/profile/delete')}
          className="absolute flex items-center border-b border-foreground/10 text-left text-foreground"
          style={{
            left: 0,
            top: 104,
            width: 375,
            height: 52,
            paddingLeft: 30,
            fontSize: 14,
            ...OPEN_SANS,
          }}
        >
          {deleteRow}
        </button>

        <InLayerNav />
      </div>
    </div>
  );
}
