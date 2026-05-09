'use client';

import type { SignageModuleInstance } from '@/lib/signage/schema';

import { FieldStack, NumberField, SelectField } from './module-form-primitives';

type NewsModule = Extract<SignageModuleInstance, { kind: 'news' }>;

export interface NewsModuleFormProps {
  module: NewsModule;
  onChange: (next: NewsModule) => void;
}

export function NewsModuleForm({ module, onChange }: NewsModuleFormProps) {
  return (
    <FieldStack>
      <SelectField
        label="Layout"
        value={module.layout}
        options={[
          { value: 'icon-headline-body', label: 'icon-headline-body' },
          { value: 'card', label: 'card' },
        ]}
        onChange={(v) => onChange({ ...module, layout: v as NewsModule['layout'] })}
      />
      <NumberField
        label="Max items"
        value={module.maxItems ?? 5}
        min={1}
        max={10}
        onChange={(n) => onChange({ ...module, maxItems: n })}
      />
    </FieldStack>
  );
}
