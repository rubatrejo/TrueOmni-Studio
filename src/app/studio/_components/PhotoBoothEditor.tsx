'use client';

import {
  Camera,
  Frame as FrameIcon,
  Image as ImageIcon,
  Sparkles,
  Sticker as StickerIcon,
} from 'lucide-react';
import { useState } from 'react';

import type { PhotoBoothConfig } from '@/lib/studio/schema';

import {
  BackgroundsTab,
  FiltersTab,
  FramesTab,
  SettingsTab,
  StickersTab,
} from './photo-booth/tabs';

type EditorTab = 'settings' | 'backgrounds' | 'frames' | 'filters' | 'stickers';

const TABS: Array<{ key: EditorTab; label: string; icon: typeof Camera }> = [
  { key: 'settings', label: 'Settings', icon: Camera },
  { key: 'backgrounds', label: 'Backgrounds', icon: ImageIcon },
  { key: 'frames', label: 'Frames', icon: FrameIcon },
  { key: 'filters', label: 'Filters', icon: Sparkles },
  { key: 'stickers', label: 'Stickers', icon: StickerIcon },
];

export function PhotoBoothEditor({
  photoBooth,
  onChange,
}: {
  photoBooth: PhotoBoothConfig;
  onChange: (next: PhotoBoothConfig) => void;
}) {
  const [tab, setTab] = useState<EditorTab>('settings');

  return (
    <div className="space-y-5">
      {/* Tab pills */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-900 dark:bg-zinc-900/40">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          const count =
            t.key === 'backgrounds'
              ? photoBooth.backgrounds.length
              : t.key === 'frames'
                ? photoBooth.frames.length
                : t.key === 'filters'
                  ? photoBooth.filters.length
                  : t.key === 'stickers'
                    ? photoBooth.stickers.length
                    : null;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition ' +
                (active
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200')
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {count !== null && (
                <span className="rounded-full bg-zinc-100 px-1.5 py-0 font-mono text-[10px] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'settings' && <SettingsTab photoBooth={photoBooth} onChange={onChange} />}
      {tab === 'backgrounds' && <BackgroundsTab photoBooth={photoBooth} onChange={onChange} />}
      {tab === 'frames' && <FramesTab photoBooth={photoBooth} onChange={onChange} />}
      {tab === 'filters' && <FiltersTab photoBooth={photoBooth} onChange={onChange} />}
      {tab === 'stickers' && <StickersTab photoBooth={photoBooth} onChange={onChange} />}
    </div>
  );
}
