'use client';

import type { SignageModuleInstance } from '@/lib/signage/schema';

import { FieldStack, NumberField, SelectField, TextField } from './module-form-primitives';

type SocialModule = Extract<SignageModuleInstance, { kind: 'social' }>;

export interface SocialModuleFormProps {
  module: SocialModule;
  onChange: (next: SocialModule) => void;
}

export function SocialModuleForm({ module, onChange }: SocialModuleFormProps) {
  return (
    <FieldStack>
      <SelectField
        label="Layout"
        value={module.layout}
        options={[
          { value: 'grid-tweet', label: 'grid-tweet' },
          { value: 'mosaic', label: 'mosaic' },
          { value: 'single', label: 'single' },
          { value: 'ticker', label: 'ticker' },
        ]}
        onChange={(v) => onChange({ ...module, layout: v as SocialModule['layout'] })}
      />
      <NumberField
        label="Max posts"
        value={module.maxPosts}
        min={1}
        max={24}
        onChange={(n) => onChange({ ...module, maxPosts: n })}
      />
      <NumberField
        label="Rotation (s)"
        value={module.rotationIntervalSec}
        min={2}
        max={60}
        onChange={(n) => onChange({ ...module, rotationIntervalSec: n })}
      />
      <TextField
        label="Hashtag filter"
        value={module.filter?.hashtag ?? ''}
        placeholder="(any)"
        onChange={(v) =>
          onChange({
            ...module,
            filter: { ...(module.filter ?? {}), hashtag: v || undefined },
          })
        }
      />
    </FieldStack>
  );
}
