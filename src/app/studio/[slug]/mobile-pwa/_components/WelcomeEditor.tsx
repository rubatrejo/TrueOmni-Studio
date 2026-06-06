'use client';

import type { PwaWelcomeConfig } from '@/lib/config';

import { ImageField } from '../../../_components/ImageField';

import { PwaGroup, PwaNumberField, PwaPanelHeader } from './pwa-ui';

/**
 * Editor del Welcome splash de la PWA (pantalla de arranque). Edita el fondo
 * fullscreen y el tiempo antes de auto-avanzar a Login. El logo del splash sale
 * del branding del cliente (no de `welcome.logo`), por eso no se expone aquí.
 */

const EMPTY: PwaWelcomeConfig = { background: '', autoAdvanceMs: 2500 };

export function WelcomeEditor({
  value,
  onChange,
}: {
  value: PwaWelcomeConfig | undefined;
  onChange: (next: PwaWelcomeConfig) => void;
}) {
  const v: PwaWelcomeConfig = { ...EMPTY, ...value };

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Welcome Splash"
        description="Arrival screen of the mobile app: fullscreen background and how long it shows before moving to Login."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="Background">
          <ImageField
            label="Background image"
            hint="Fullscreen photo behind the logo (390×844). JPG or PNG."
            layout="cover"
            aspect="390/844"
            value={v.background}
            onChange={(next) => onChange({ ...v, background: next ?? '' })}
          />
        </PwaGroup>

        <PwaGroup title="Timing">
          <PwaNumberField
            label="Auto-advance to Login"
            value={v.autoAdvanceMs ?? 2500}
            min={0}
            step={100}
            suffix="ms"
            onChange={(autoAdvanceMs) => onChange({ ...v, autoAdvanceMs })}
          />
        </PwaGroup>
      </div>
    </div>
  );
}
