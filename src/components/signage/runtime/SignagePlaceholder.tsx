'use client';

import { useEffect, useState } from 'react';

import type { SignageClientResolved, SignageDisplayConfig } from '@/lib/signage/schema';

/**
 * Placeholder visual de DS0. Renderea metadata mínima del cliente y display
 * cargados, dentro del SignageStage. Será reemplazado por <SignagePlayer>
 * (DS2) y por templates pixel-perfect (DS3..DS10).
 *
 * Sin handlers touch / pointer / keyboard. Solo lectura.
 */
export interface SignagePlaceholderProps {
  client: SignageClientResolved;
  display: SignageDisplayConfig;
}

export function SignagePlaceholder({ client, display }: SignagePlaceholderProps) {
  const [now, setNow] = useState<string>('');
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat(client.locale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: client.header.clockFormat === '12h',
      timeZone: client.timezone,
    });
    const tick = () => setNow(fmt.format(new Date()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [client.header.clockFormat, client.locale, client.timezone]);

  return (
    <div className="flex h-full w-full flex-col bg-signage-surface text-signage-text">
      <div
        className="flex items-center justify-between bg-signage-header-bg px-12 text-signage-header-text"
        style={{ height: `var(--signage-header-height, 80px)` }}
      >
        <span className="font-semibold tracking-wide">{client.name}</span>
        <span className="font-mono text-sm tabular-nums">{now}</span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="grid max-w-[60rem] gap-6 rounded-lg border border-signage-border bg-signage-surface-alt p-12 text-signage-text">
          <h1 className="text-4xl font-semibold">Signage runtime</h1>
          <p className="text-base text-signage-text-muted">
            Bootstrap (DS0) — pixel-perfect templates land in DS3+.
          </p>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 font-mono text-sm">
            <dt className="text-signage-text-muted">Client</dt>
            <dd>{client.slug}</dd>
            <dt className="text-signage-text-muted">Display</dt>
            <dd>{display.slug}</dd>
            <dt className="text-signage-text-muted">Locale</dt>
            <dd>{client.locale}</dd>
            <dt className="text-signage-text-muted">Timezone</dt>
            <dd>{client.timezone}</dd>
            <dt className="text-signage-text-muted">Header position</dt>
            <dd>{client.header.position}</dd>
            <dt className="text-signage-text-muted">Forecast days</dt>
            <dd>{client.header.forecastDays}</dd>
            <dt className="text-signage-text-muted">Resolution target</dt>
            <dd>{display.settings.targetResolution}</dd>
            <dt className="text-signage-text-muted">Audio</dt>
            <dd>{display.settings.audio ? 'on' : 'off'}</dd>
            <dt className="text-signage-text-muted">Slides</dt>
            <dd>{display.playlist.length}</dd>
            <dt className="text-signage-text-muted">Default duration</dt>
            <dd>{display.settings.defaultDurationMs} ms</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
