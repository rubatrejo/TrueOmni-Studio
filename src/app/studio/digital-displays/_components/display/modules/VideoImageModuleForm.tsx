'use client';

import type { SignageModuleInstance } from '@/lib/signage/schema';

import { CheckboxField, FieldStack, SelectField } from './module-form-primitives';
import { SignageMediaField } from './SignageMediaField';

type VideoImageModule = Extract<SignageModuleInstance, { kind: 'video-image' }>;

export interface VideoImageModuleFormProps {
  module: VideoImageModule;
  onChange: (next: VideoImageModule) => void;
}

export function VideoImageModuleForm({ module, onChange }: VideoImageModuleFormProps) {
  return (
    <FieldStack>
      <SignageMediaField
        label="Asset"
        hint="Imagen o video full-bleed. Sube un archivo (≤5MB) o pega un path/URL."
        aspect="16/9"
        kind={module.asset.kind}
        value={module.asset.url}
        onChange={(next) =>
          onChange({
            ...module,
            asset: {
              ...module.asset,
              url: next?.src ?? '',
              kind: next?.kind ?? module.asset.kind,
            },
          })
        }
      />
      <CheckboxField
        label="Loop"
        checked={module.loop}
        onChange={(b) => onChange({ ...module, loop: b })}
      />
      <SelectField
        label="Fit"
        value={module.fit}
        options={[
          { value: 'cover', label: 'cover' },
          { value: 'contain', label: 'contain' },
        ]}
        onChange={(v) => onChange({ ...module, fit: v as 'cover' | 'contain' })}
      />
    </FieldStack>
  );
}
