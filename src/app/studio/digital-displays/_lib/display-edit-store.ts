'use client';

import { create } from 'zustand';

import type { SignageDisplayConfig, SignageSlide } from '@/lib/signage/schema';

/**
 * Working copy zustand del editor de display.
 *
 * Mantiene el draft local mientras el operador edita. Cualquier mutación
 * marca `dirty: true`. Un autosave externo dispara PUT al KV 1s después del
 * último cambio (`useDebouncedAutosave`). En paralelo, el bridge hook hace
 * `pushDisplay` al iframe con debounce 120ms para preview live.
 *
 * **Modelo multi-playlist** (siempre normalizado en draft):
 *  - `draft.playlists` siempre tiene al menos 1 playlist.
 *  - `draft.activePlaylistId` apunta a la playlist activa.
 *  - `draft.playlist` se mantiene sincronizado con la playlist activa para
 *    back-compat con el runtime y consumers que lean `playlist` directo.
 *
 * El `init()` migra cualquier display con shape legacy (solo `playlist`,
 * sin `playlists`) sintetizando una playlist `main` con todas las slides.
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

  // Slides — operan sobre la playlist activa.
  addSlide: (slide: SignageSlide) => void;
  removeSlide: (slideId: string) => void;
  reorderSlides: (fromIdx: number, toIdx: number) => void;
  updateSlide: (slideId: string, patch: Partial<SignageSlide>) => void;

  // Playlists.
  setActivePlaylist: (id: string) => void;
  addPlaylist: (name: string) => string;
  renamePlaylist: (id: string, name: string) => void;
  removePlaylist: (id: string) => void;

  markSaving: (saving: boolean) => void;
  markSaved: () => void;
  setError: (err: string | null) => void;
}

function genPlaylistId(): string {
  return `pl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Devuelve un draft normalizado: con `playlists[]` siempre populado y
 * `activePlaylistId` válido. Mantiene `playlist` sincronizado con la activa.
 */
function normalize(display: SignageDisplayConfig): SignageDisplayConfig {
  const cloned = structuredClone(display);
  if (!cloned.playlists || cloned.playlists.length === 0) {
    const id = 'main';
    cloned.playlists = [
      { id, name: 'Main', slides: cloned.playlist ?? [] },
    ];
    cloned.activePlaylistId = id;
  } else if (
    !cloned.activePlaylistId ||
    !cloned.playlists.some((p) => p.id === cloned.activePlaylistId)
  ) {
    cloned.activePlaylistId = cloned.playlists[0].id;
  }
  // Sync legacy `playlist` field con la activa.
  const active = cloned.playlists.find((p) => p.id === cloned.activePlaylistId);
  cloned.playlist = active ? [...active.slides] : [];
  return cloned;
}

/**
 * Actualiza la playlist activa (slides) y mantiene `playlist` sincronizado.
 */
function withActiveSlides(
  draft: SignageDisplayConfig,
  nextSlides: SignageSlide[],
): SignageDisplayConfig {
  const playlists = (draft.playlists ?? []).map((p) =>
    p.id === draft.activePlaylistId ? { ...p, slides: nextSlides } : p,
  );
  return { ...draft, playlists, playlist: nextSlides };
}

function getActiveSlides(draft: SignageDisplayConfig): SignageSlide[] {
  const active = (draft.playlists ?? []).find(
    (p) => p.id === draft.activePlaylistId,
  );
  return active?.slides ?? draft.playlist ?? [];
}

export const useDisplayEditStore = create<DisplayEditState>((set, get) => ({
  draft: null,
  dirty: false,
  saving: false,
  lastSavedAt: null,
  error: null,

  init: (display) =>
    set({
      draft: normalize(display),
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
      draft: withActiveSlides(draft, [...getActiveSlides(draft), slide]),
      dirty: true,
      error: null,
    });
  },

  removeSlide: (slideId) => {
    const { draft } = get();
    if (!draft) return;
    set({
      draft: withActiveSlides(
        draft,
        getActiveSlides(draft).filter((s) => s.id !== slideId),
      ),
      dirty: true,
      error: null,
    });
  },

  reorderSlides: (fromIdx, toIdx) => {
    const { draft } = get();
    if (!draft) return;
    const slides = getActiveSlides(draft);
    if (
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= slides.length ||
      toIdx >= slides.length ||
      fromIdx === toIdx
    ) {
      return;
    }
    const next = [...slides];
    const [moved] = next.splice(fromIdx, 1);
    if (!moved) return;
    next.splice(toIdx, 0, moved);
    set({ draft: withActiveSlides(draft, next), dirty: true, error: null });
  },

  updateSlide: (slideId, patch) => {
    const { draft } = get();
    if (!draft) return;
    set({
      draft: withActiveSlides(
        draft,
        getActiveSlides(draft).map((s) =>
          s.id === slideId ? { ...s, ...patch } : s,
        ),
      ),
      dirty: true,
      error: null,
    });
  },

  setActivePlaylist: (id) => {
    const { draft } = get();
    if (!draft || !draft.playlists?.some((p) => p.id === id)) return;
    const active = draft.playlists.find((p) => p.id === id);
    set({
      draft: {
        ...draft,
        activePlaylistId: id,
        playlist: active ? [...active.slides] : [],
      },
      dirty: true,
      error: null,
    });
  },

  addPlaylist: (name) => {
    const { draft } = get();
    if (!draft) return '';
    const id = genPlaylistId();
    const trimmed = name.trim() || `Playlist ${(draft.playlists?.length ?? 0) + 1}`;
    const playlists = [
      ...(draft.playlists ?? []),
      { id, name: trimmed, slides: [] },
    ];
    set({
      draft: { ...draft, playlists, activePlaylistId: id, playlist: [] },
      dirty: true,
      error: null,
    });
    return id;
  },

  renamePlaylist: (id, name) => {
    const { draft } = get();
    if (!draft) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const playlists = (draft.playlists ?? []).map((p) =>
      p.id === id ? { ...p, name: trimmed } : p,
    );
    set({ draft: { ...draft, playlists }, dirty: true, error: null });
  },

  removePlaylist: (id) => {
    const { draft } = get();
    if (!draft) return;
    const playlists = (draft.playlists ?? []).filter((p) => p.id !== id);
    if (playlists.length === 0) return; // No borrar la última.
    let activePlaylistId = draft.activePlaylistId;
    if (activePlaylistId === id) {
      activePlaylistId = playlists[0].id;
    }
    const active = playlists.find((p) => p.id === activePlaylistId);
    set({
      draft: {
        ...draft,
        playlists,
        activePlaylistId,
        playlist: active ? [...active.slides] : [],
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
