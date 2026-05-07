'use client';

import { create } from 'zustand';

import type {
  SignageBranding,
  SignageClientFile,
  SignageHeader,
} from '@/lib/signage/schema';

/**
 * Working copy zustand del editor de theme signage.
 *
 * Mantiene el draft del `client.json` mientras el operador edita Branding /
 * Header / metadata. Cualquier mutación marca `dirty: true`. Autosave
 * externo dispara PUT al KV 1s después del último cambio. En paralelo, el
 * bridge hace `pushClient` al iframe con debounce 120ms para preview live.
 *
 * Espejo de `useDisplayEditStore` (DSS4) pero scoped al cliente.
 */
interface ThemeEditState {
  draft: SignageClientFile | null;
  dirty: boolean;
  saving: boolean;
  lastSavedAt: number | null;
  error: string | null;

  init: (client: SignageClientFile) => void;
  reset: () => void;

  updateBranding: (patch: Partial<SignageBranding>) => void;
  setBrandingTokens: (tokens: Record<string, string>) => void;
  setBrandingToken: (key: string, value: string) => void;
  removeBrandingToken: (key: string) => void;
  updateHeader: (patch: Partial<SignageHeader>) => void;
  updateMeta: (patch: Partial<Pick<SignageClientFile, 'name' | 'website'>>) => void;

  markSaving: (saving: boolean) => void;
  markSaved: () => void;
  setError: (err: string | null) => void;
}

export const useThemeEditStore = create<ThemeEditState>((set, get) => ({
  draft: null,
  dirty: false,
  saving: false,
  lastSavedAt: null,
  error: null,

  init: (client) =>
    set({
      draft: structuredClone(client),
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

  updateBranding: (patch) => {
    const { draft } = get();
    if (!draft) return;
    set({
      draft: { ...draft, branding: { ...draft.branding, ...patch } },
      dirty: true,
      error: null,
    });
  },

  setBrandingTokens: (tokens) => {
    const { draft } = get();
    if (!draft) return;
    set({
      draft: {
        ...draft,
        branding: { ...draft.branding, tokens: { ...tokens } },
      },
      dirty: true,
      error: null,
    });
  },

  setBrandingToken: (key, value) => {
    const { draft } = get();
    if (!draft) return;
    const next = { ...(draft.branding.tokens ?? {}) };
    next[key] = value;
    set({
      draft: { ...draft, branding: { ...draft.branding, tokens: next } },
      dirty: true,
      error: null,
    });
  },

  removeBrandingToken: (key) => {
    const { draft } = get();
    if (!draft) return;
    const next = { ...(draft.branding.tokens ?? {}) };
    delete next[key];
    set({
      draft: { ...draft, branding: { ...draft.branding, tokens: next } },
      dirty: true,
      error: null,
    });
  },

  updateHeader: (patch) => {
    const { draft } = get();
    if (!draft) return;
    set({
      draft: { ...draft, header: { ...draft.header, ...patch } },
      dirty: true,
      error: null,
    });
  },

  updateMeta: (patch) => {
    const { draft } = get();
    if (!draft) return;
    set({
      draft: { ...draft, ...patch },
      dirty: true,
      error: null,
    });
  },

  markSaving: (saving) => set({ saving }),
  markSaved: () =>
    set({ saving: false, dirty: false, lastSavedAt: Date.now(), error: null }),
  setError: (err) => set({ error: err, saving: false }),
}));
