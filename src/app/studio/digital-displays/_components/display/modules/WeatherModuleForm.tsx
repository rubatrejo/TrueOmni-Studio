'use client';

import type { SignageModuleInstance } from '@/lib/signage/schema';

import { FieldStack, SelectField } from './module-form-primitives';

type WeatherModule = Extract<SignageModuleInstance, { kind: 'weather' }>;

export interface WeatherModuleFormProps {
  module: WeatherModule;
  onChange: (next: WeatherModule) => void;
}

export function WeatherModuleForm({ module, onChange }: WeatherModuleFormProps) {
  return (
    <FieldStack>
      <SelectField
        label="Layout"
        value={module.layout}
        options={[
          { value: 'compact', label: 'compact' },
          { value: 'detailed', label: 'detailed' },
          { value: 'hero', label: 'hero' },
        ]}
        onChange={(v) => onChange({ ...module, layout: v as WeatherModule['layout'] })}
      />
    </FieldStack>
  );
}
