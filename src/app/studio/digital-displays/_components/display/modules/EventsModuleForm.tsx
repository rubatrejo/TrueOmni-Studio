'use client';

import type { SignageModuleInstance } from '@/lib/signage/schema';

import { FieldStack, NumberField, SelectField, TextField } from './module-form-primitives';

type EventsModule = Extract<SignageModuleInstance, { kind: 'events' }>;

export interface EventsModuleFormProps {
  module: EventsModule;
  onChange: (next: EventsModule) => void;
}

export function EventsModuleForm({ module, onChange }: EventsModuleFormProps) {
  return (
    <FieldStack>
      <SelectField
        label="Layout"
        value={module.layout}
        options={[
          { value: 'hero-grid', label: 'hero-grid' },
          { value: 'list', label: 'list' },
          { value: 'mosaic', label: 'mosaic' },
        ]}
        onChange={(v) => onChange({ ...module, layout: v as EventsModule['layout'] })}
      />
      <NumberField
        label="Max items"
        value={module.maxItems ?? 5}
        min={1}
        max={20}
        onChange={(n) => onChange({ ...module, maxItems: n })}
      />
      <TextField
        label="Title override"
        value={module.titleOverride ?? ''}
        placeholder="(use default)"
        onChange={(v) =>
          onChange({ ...module, titleOverride: v || undefined })
        }
      />
    </FieldStack>
  );
}
