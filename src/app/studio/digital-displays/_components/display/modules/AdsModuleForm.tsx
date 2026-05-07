'use client';

import type { SignageModuleInstance } from '@/lib/signage/schema';

import {
  FieldStack,
  NumberField,
  TextField,
} from './module-form-primitives';
import { SignageMediaField } from './SignageMediaField';

type AdsModule = Extract<SignageModuleInstance, { kind: 'ads' }>;

export interface AdsModuleFormProps {
  module: AdsModule;
  onChange: (next: AdsModule) => void;
}

export function AdsModuleForm({ module, onChange }: AdsModuleFormProps) {
  return (
    <FieldStack>
      <SignageMediaField
        label="Asset"
        hint="Imagen o video del ad. Sube un archivo (≤5MB) o pega un path/URL."
        aspect="16/9"
        kind={module.asset.kind ?? 'image'}
        value={module.asset.url}
        onChange={(next) =>
          onChange({
            ...module,
            asset: {
              ...module.asset,
              url: next?.src ?? '',
              kind: next?.kind ?? module.asset.kind ?? 'image',
            },
          })
        }
      />
      <TextField
        label="Click link"
        value={module.link ?? ''}
        placeholder="https://..."
        onChange={(v) => onChange({ ...module, link: v || undefined })}
      />
      <TextField
        label="QR target"
        value={module.qr ?? ''}
        placeholder="https://..."
        onChange={(v) => onChange({ ...module, qr: v || undefined })}
      />
      <NumberField
        label="Weight"
        value={module.weight}
        min={1}
        max={10}
        onChange={(n) => onChange({ ...module, weight: n })}
      />
    </FieldStack>
  );
}
