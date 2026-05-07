'use client';

import type {
  SignageModuleInstance,
  SignageModuleKind,
  SignageSlotConfig,
} from '@/lib/signage/schema';
import {
  defaultModuleFor,
  getTemplateDescriptor,
  type TemplateSlotDescriptor,
} from '@/lib/signage/template-catalog';

import { AdsModuleForm } from './modules/AdsModuleForm';
import { EventsModuleForm } from './modules/EventsModuleForm';
import { NewsModuleForm } from './modules/NewsModuleForm';
import { SocialModuleForm } from './modules/SocialModuleForm';
import { VideoImageModuleForm } from './modules/VideoImageModuleForm';
import { WeatherModuleForm } from './modules/WeatherModuleForm';

/**
 * `<SlideRowExpanded>` — Configurador de slots del slide (DSS5).
 *
 * Para cada `templateSlot` declarado por el `templateDescriptor`, muestra:
 *  - Header con `slot.key` + acceptedModules pills.
 *  - Dropdown "(none) | <accepted module kinds>".
 *  - Form correspondiente del module si está configurado.
 *
 * El operador asigna el module type por slot. Cuando cambia, llamamos a
 * `onSlotsChange` con el array `slots` actualizado.
 */
export interface SlideRowExpandedProps {
  templateId: string;
  slots: SignageSlotConfig[];
  onSlotsChange: (next: SignageSlotConfig[]) => void;
}

export function SlideRowExpanded({ templateId, slots, onSlotsChange }: SlideRowExpandedProps) {
  const descriptor = getTemplateDescriptor(templateId);

  if (!descriptor) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
        Unknown template <code className="font-mono">{templateId}</code>. Slots
        no se pueden configurar.
      </div>
    );
  }

  const slotMap = new Map(slots.map((s) => [s.slotKey, s]));

  function setSlot(key: string, next: SignageSlotConfig | null) {
    const without = slots.filter((s) => s.slotKey !== key);
    onSlotsChange(next ? [...without, next] : without);
  }

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-900">
      {descriptor.slots.map((tplSlot) => {
        const current = slotMap.get(tplSlot.key);
        return (
          <SlotCard
            key={tplSlot.key}
            templateSlot={tplSlot}
            current={current ?? null}
            onChange={(next) => setSlot(tplSlot.key, next)}
          />
        );
      })}
    </div>
  );
}

function SlotCard({
  templateSlot,
  current,
  onChange,
}: {
  templateSlot: TemplateSlotDescriptor;
  current: SignageSlotConfig | null;
  onChange: (next: SignageSlotConfig | null) => void;
}) {
  const moduleKind = current?.module.kind ?? '';
  const accepted = templateSlot.acceptedModules;

  function handleKindChange(value: string) {
    if (!value) {
      onChange(null);
      return;
    }
    const kind = value as SignageModuleKind;
    onChange({
      slotKey: templateSlot.key,
      module: defaultModuleFor(kind),
    });
  }

  function handleModuleChange(next: SignageModuleInstance) {
    onChange({ slotKey: templateSlot.key, module: next });
  }

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      <header className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[10.5px] text-zinc-700 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-700">
            {templateSlot.key}
          </code>
          <span className="text-[10.5px] text-zinc-500">
            {templateSlot.kind} · {templateSlot.rect.w}×{templateSlot.rect.h}
          </span>
        </div>
        <select
          value={moduleKind}
          onChange={(e) => handleKindChange(e.target.value)}
          className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[10.5px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <option value="">(none)</option>
          {accepted.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </header>

      {current ? <ModuleFormSwitch module={current.module} onChange={handleModuleChange} /> : null}
    </div>
  );
}

function ModuleFormSwitch({
  module,
  onChange,
}: {
  module: SignageModuleInstance;
  onChange: (next: SignageModuleInstance) => void;
}) {
  if (module.kind === 'events') {
    return <EventsModuleForm module={module} onChange={onChange} />;
  }
  if (module.kind === 'social') {
    return <SocialModuleForm module={module} onChange={onChange} />;
  }
  if (module.kind === 'video-image') {
    return <VideoImageModuleForm module={module} onChange={onChange} />;
  }
  if (module.kind === 'ads') {
    return <AdsModuleForm module={module} onChange={onChange} />;
  }
  if (module.kind === 'news') {
    return <NewsModuleForm module={module} onChange={onChange} />;
  }
  if (module.kind === 'weather') {
    return <WeatherModuleForm module={module} onChange={onChange} />;
  }
  return null;
}
