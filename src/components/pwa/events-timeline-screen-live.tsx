'use client';

import type { ComponentProps } from 'react';

import type { PwaEventsModuleConfig } from '@/lib/config';

import { EventsTimelineScreen } from './events-timeline-screen';
import { usePwaSection } from './pwa-bridge-context';

type TimelineData = Omit<ComponentProps<typeof EventsTimelineScreen>, 'texts'>;

/**
 * Wrapper live de la timeline de Events. Lee el override de `features.pwa.events`
 * (preview en vivo del Studio) y sustituye solo los textos; los eventos vienen del
 * server. No toca `EventsTimelineScreen`.
 */
export function EventsTimelineScreenLive({
  config,
  ...data
}: TimelineData & {
  config: PwaEventsModuleConfig;
}) {
  const cfg = usePwaSection('events', config) ?? config;
  return <EventsTimelineScreen {...data} texts={cfg} />;
}
