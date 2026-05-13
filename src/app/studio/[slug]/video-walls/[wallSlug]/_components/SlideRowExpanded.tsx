'use client';

import { AdsModuleForm } from '@/app/studio/digital-displays/_components/display/modules/AdsModuleForm';
import { EventsModuleForm } from '@/app/studio/digital-displays/_components/display/modules/EventsModuleForm';
import { NewsModuleForm } from '@/app/studio/digital-displays/_components/display/modules/NewsModuleForm';
import { SocialModuleForm } from '@/app/studio/digital-displays/_components/display/modules/SocialModuleForm';
import { VideoImageModuleForm } from '@/app/studio/digital-displays/_components/display/modules/VideoImageModuleForm';
import { WeatherModuleForm } from '@/app/studio/digital-displays/_components/display/modules/WeatherModuleForm';
import { getTemplate } from '@/components/video-walls/templates/registry';
import '@/components/video-walls/templates/load-templates';
import type { VideoWallTemplateSlot } from '@/components/video-walls/templates/types';
import { defaultModuleFor } from '@/lib/signage/template-catalog';
import type { GridConfig } from '@/lib/video-walls/dimensions';
import type {
  VideoWallModuleInstance,
  VideoWallModuleKind,
  VideoWallSlotConfig,
} from '@/lib/video-walls/schema';

/**
 * `<SlideRowExpanded>` (Video Walls) — configurador de slots del slide.
 *
 * Para cada `templateSlot` declarado por el template del registry,
 * muestra header (slotKey + kind + cell footprint) + selector de module
 * kind + form correspondiente. Reusa los module forms del DD ya que
 * `SignageModuleInstance === VideoWallModuleInstance` (re-export shared).
 */
export interface SlideRowExpandedProps {
  templateId: string;
  grid: GridConfig;
  slots: VideoWallSlotConfig[];
  onSlotsChange: (next: VideoWallSlotConfig[]) => void;
}

export function SlideRowExpanded({
  templateId,
  grid,
  slots,
  onSlotsChange,
}: SlideRowExpandedProps) {
  const template = getTemplate(templateId, grid);

  if (!template) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300">
        Unknown template <code className="font-mono">{templateId}</code> for grid{' '}
        <code className="font-mono">{grid}</code>. Slots can&apos;t be configured.
      </div>
    );
  }

  const slotMap = new Map(slots.map((s) => [s.slotKey, s]));

  function setSlot(key: string, next: VideoWallSlotConfig | null) {
    const without = slots.filter((s) => s.slotKey !== key);
    onSlotsChange(next ? [...without, next] : without);
  }

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-900">
      {template.slots.map((tplSlot) => {
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
  templateSlot: VideoWallTemplateSlot;
  current: VideoWallSlotConfig | null;
  onChange: (next: VideoWallSlotConfig | null) => void;
}) {
  const moduleKind = current?.module.kind ?? '';
  const accepted = templateSlot.acceptedModules;
  const { row, col, rowSpan, colSpan } = templateSlot.cellRect;
  const footprint =
    `r${row + 1}c${col + 1}` + (rowSpan > 1 || colSpan > 1 ? ` · ${rowSpan}×${colSpan}` : '');

  function handleKindChange(value: string) {
    if (!value) {
      onChange(null);
      return;
    }
    const kind = value as VideoWallModuleKind;
    onChange({ slotKey: templateSlot.key, module: defaultModuleFor(kind) });
  }

  function handleModuleChange(next: VideoWallModuleInstance) {
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
            {templateSlot.kind} · {footprint}
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
  module: VideoWallModuleInstance;
  onChange: (next: VideoWallModuleInstance) => void;
}) {
  if (module.kind === 'events') return <EventsModuleForm module={module} onChange={onChange} />;
  if (module.kind === 'social') return <SocialModuleForm module={module} onChange={onChange} />;
  if (module.kind === 'video-image')
    return <VideoImageModuleForm module={module} onChange={onChange} />;
  if (module.kind === 'ads') return <AdsModuleForm module={module} onChange={onChange} />;
  if (module.kind === 'news') return <NewsModuleForm module={module} onChange={onChange} />;
  if (module.kind === 'weather') return <WeatherModuleForm module={module} onChange={onChange} />;
  return null;
}
