'use client';

import { useEffect, useState } from 'react';

import type {
  SignageClientResolved,
  SignageDisplayConfig,
  SignageDisplaySettings,
  SignageSlide,
} from '@/lib/signage/schema';

import '../templates/load-templates';
import { getTemplate } from '../templates/registry';

/**
 * `<SignagePlayer>` — rotación básica de slides.
 *
 * DS2: rotación lineal con cut transition. La duración por slide viene de
 * `slide.durationMs` (con fallback a `settings.defaultDurationMs`). Sin
 * dayparting (DS13) ni transitions reales (DS12).
 *
 * Cero touch handlers — view-only puro.
 */
export interface SignagePlayerProps {
  client: SignageClientResolved;
  display: SignageDisplayConfig;
  settings: SignageDisplaySettings;
  playlist: SignageSlide[];
}

export function SignagePlayer({ client, display, settings, playlist }: SignagePlayerProps) {
  const [index, setIndex] = useState(0);

  const slide = playlist[index];
  const duration = slide?.durationMs ?? settings.defaultDurationMs;

  useEffect(() => {
    if (playlist.length <= 1) return;
    const id = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % playlist.length);
    }, duration);
    return () => window.clearTimeout(id);
  }, [duration, index, playlist.length]);

  if (playlist.length === 0) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-signage-surface text-signage-text-muted"
        aria-hidden="true"
      >
        <div className="text-center">
          <p className="text-2xl font-medium">No slides configured</p>
          <p className="mt-2 text-base">
            Add slides to <code>displays/{display.slug}/display.json</code> or via the editor (DSS4+).
          </p>
        </div>
      </div>
    );
  }

  if (!slide) {
    return null;
  }

  const template = getTemplate(slide.templateId);
  if (!template) {
    return (
      <div
        className="flex h-full w-full items-center justify-center bg-signage-destructive text-signage-text-on-brand"
        aria-hidden="true"
      >
        <div className="text-center">
          <p className="text-2xl font-medium">Unknown template</p>
          <p className="mt-2 font-mono text-base">{slide.templateId}</p>
        </div>
      </div>
    );
  }

  const { Render } = template;
  return <Render slots={slide.slots} client={client} display={display} />;
}
