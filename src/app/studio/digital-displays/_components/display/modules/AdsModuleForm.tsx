'use client';

import type { SignageModuleInstance } from '@/lib/signage/schema';

import {
  FieldStack,
  NumberField,
  SelectField,
  TextField,
} from './module-form-primitives';

type AdsModule = Extract<SignageModuleInstance, { kind: 'ads' }>;

export interface AdsModuleFormProps {
  module: AdsModule;
  onChange: (next: AdsModule) => void;
}

export function AdsModuleForm({ module, onChange }: AdsModuleFormProps) {
  return (
    <FieldStack>
      <SelectField
        label="Asset kind"
        value={module.asset.kind ?? 'image'}
        options={[
          { value: 'image', label: 'image' },
          { value: 'video', label: 'video' },
        ]}
        onChange={(v) =>
          onChange({
            ...module,
            asset: { ...module.asset, kind: v as 'image' | 'video' },
          })
        }
      />
      <TextField
        label="Asset URL"
        value={module.asset.url}
        placeholder="assets/ads/full-ad.png"
        onChange={(v) => onChange({ ...module, asset: { ...module.asset, url: v } })}
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
