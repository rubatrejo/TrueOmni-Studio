'use client';

import type { SignageModuleInstance } from '@/lib/signage/schema';

import {
  CheckboxField,
  FieldStack,
  SelectField,
  TextField,
} from './module-form-primitives';

type VideoImageModule = Extract<SignageModuleInstance, { kind: 'video-image' }>;

export interface VideoImageModuleFormProps {
  module: VideoImageModule;
  onChange: (next: VideoImageModule) => void;
}

export function VideoImageModuleForm({ module, onChange }: VideoImageModuleFormProps) {
  return (
    <FieldStack>
      <SelectField
        label="Asset kind"
        value={module.asset.kind}
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
        placeholder="assets/video-image/pool.mp4"
        onChange={(v) => onChange({ ...module, asset: { ...module.asset, url: v } })}
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
