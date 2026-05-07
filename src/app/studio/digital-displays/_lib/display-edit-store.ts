'use client';

import { create } from 'zustand';

import type { SignageDisplayConfig, SignageSlide } from '@/lib/signage/schema';

/**
 * Working copy zustand del editor de display (DSS4).
 *
 * Mantiene el draft local mientras el operador edita. Cualquier mutación
 * marca `dirty: true`. Un autosave externo dispara PUT al KV 1s después del
 * último cambio (`useDebouncedAutosave`). En paralelo, el bridge hook hace
 * `pushDisplay` al iframe con debounce 120ms para preview live.
 *
 * NO persiste por sí solo — el editor llama `markSaving/markSaved` desde
 * el callback de `saveDisplay`.
 */
interface DisplayEditState {
  draft: SignageDisplayConfig | null;
  dirty: boolean;
  saving: boolean;
  lastSavedAt: number | null;
  error: string | null;

  init: (display: SignageDisplayConfig) => void;
  reset: () => void;

  updateSettings: (patch: Partial<SignageDisplayConfig['settings']>) => void;
  addSlide: (slide: SignageSlide) => void;
  removeSlide: (slideId: string) => void;
  reorderSlides: (fromIdx: number, toIdx: number) => void;
  updateSlide: (slideId: string, patch: Partial<SignageSlide>) => void;

  markSaving: (saving: boolean) => void;
  markSaved: () => void;
  setError: (err: string | null) => void;
}

export const useDisplayEditStore = create<DisplayEditState>((set, get) => ({
  draft: null,
  dirty: false,
  saving: false,
  lastSavedAt: null,
  error: null,

  init: (display) =>
    set({
      draft: structuredClone(display),
      dirty: false,
      saving: false,
      lastSavedAt: null,
      error: null,
    }),

  reset: () =>
    set({
      draft: null,
      dirty: false,
      saving: false,
      lastSavedAt: null,
      error: null,
    }),

  updateSettings: (patch) => {
    const { draft } = get();
    if (!draft) return;
    set({
      draft: { ...draft, settings: { ...draft.settings, ...patch } },
      dirty: true,
      error: null,
    });
  },

  addSlide: (slide) => {
    const { draft } = get();
    if (!draft) return;
    set({
      draft: { ...draft, playlist: [...draft.playlist, slide] },
      dirty: true,
      error: null,
    });
  },

  removeSlide: (slideId) => {
    const { draft } = get();
    if (!draft) return;
    set({
      draft: { ...draft, playlist: draft.playlist.filter((s) => s.id !== slideId) },
      dirty: true,
      error: null,
    });
  },

  reorderSlides: (fromIdx, toIdx) => {
    const { draft } = get();
    if (!draft) return;
    if (
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= draft.playlist.length ||
      toIdx >= draft.playlist.length ||
      fromIdx === toIdx
    ) {
      return;
    }
    const next = [...draft.playlist];
    const [moved] = next.splice(fromIdx, 1);
    if (!moved) return;
    next.splice(toIdx, 0, moved);
    set({ draft: { ...draft, playlist: next }, dirty: true, error: null });
  },

  updateSlide: (slideId, patch) => {
    const { draft } = get();
    if (!draft) return;
    set({
      draft: {
        ...draft,
        playlist: draft.playlist.map((s) =>
          s.id === slideId ? { ...s, ...patch } : s,
        ),
      },
      dirty: true,
      error: null,
    });
  },

  markSaving: (saving) => set({ saving }),
  markSaved: () =>
    set({ saving: false, dirty: false, lastSavedAt: Date.now(), error: null }),
  setError: (err) => set({ saving: false, error: err }),
}));
