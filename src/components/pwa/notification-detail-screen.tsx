'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useNotifications } from '@/hooks/use-notifications';
import { resolveAssetUrl } from '@/lib/asset-url';
import type { PwaNotification } from '@/lib/config';

import { PwaBottomNav } from './bottom-nav';
import { S } from './mobile-layer';
import { PwaSubHeader } from './pwa-sub-header';

const PWA = 'hsl(var(--pwa-primary))';
const OPEN_SANS = 'var(--font-open-sans)';

/**
 * Detalle de notificación (`/pwa/notifications/[id]`). Header 90px (back → lista),
 * hero (si hay imagen) + título + cuerpo + botón ACTION TEXT (deep-link) si la
 * notificación trae acción. Marca la notificación como leída al montar.
 */
export function NotificationDetailScreen({
  headerTitle,
  notification,
}: {
  headerTitle: string;
  notification: PwaNotification;
}) {
  const router = useRouter();
  const { markRead } = useNotifications([notification]);

  useEffect(() => {
    markRead(notification.id);
  }, [markRead, notification.id]);

  const { image, title, body, action } = notification;

  return (
    <div className="relative flex h-full w-full flex-col bg-background">
      {/* Header brand (escalado, 90px) */}
      <div className="relative z-10 shrink-0" style={{ height: 90 * S }}>
        <div
          className="absolute left-0 top-0"
          style={{ width: 375, height: 90, transform: `scale(${S})`, transformOrigin: 'top left' }}
        >
          <PwaSubHeader title={headerTitle} backHref="/pwa/notifications" />
        </div>
      </div>

      {/* Cuerpo scroll */}
      <div className="scrollbar-hide flex-1 overflow-y-auto">
        {image ? (
          <div
            className="w-full bg-cover bg-center"
            style={{ height: 200, backgroundImage: `url("${resolveAssetUrl(image)}")` }}
          />
        ) : null}

        <h1
          className="px-6 pb-3 pt-6 font-bold text-foreground"
          style={{ fontSize: 20, lineHeight: 1.3, fontFamily: OPEN_SANS }}
        >
          {title}
        </h1>
        <div className="border-b" style={{ borderColor: 'hsl(var(--foreground) / 0.1)' }} />
        <p
          className="px-6 py-5 text-foreground/80"
          style={{ fontSize: 15, lineHeight: 1.6, fontFamily: OPEN_SANS }}
        >
          {body}
        </p>

        {action ? (
          <div className="px-6 pb-8 pt-2">
            <button
              type="button"
              onClick={() => router.push(action.href)}
              className="w-full rounded-[8px] font-bold uppercase"
              style={{
                height: 50,
                border: `1.5px solid ${PWA}`,
                color: PWA,
                fontSize: 14,
                letterSpacing: '0.04em',
                fontFamily: OPEN_SANS,
              }}
            >
              {action.label}
            </button>
          </div>
        ) : null}
      </div>

      <PwaBottomNav />
    </div>
  );
}
