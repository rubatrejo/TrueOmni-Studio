'use client';

import { create } from 'zustand';

import type { SignageClientFile, SignageDisplayConfig } from '@/lib/signage/schema';

/**
 * Store zustand del bridge signage runtime (DSS3).
 *
 * El `<SignageBridge>` escucha postMessage del editor Studio y popula este
 * store. DSS4-5 conectará los componentes del runtime para leer overrides
 * desde aquí con fallback a la prop server.
 *
 * En DSS3 los patches se almacenan pero **no se aplican visualmente** — el
 * runtime sigue leyendo de fs/server. La validación es que el flow llega
 * end-to-end (handshake + recepción de mensajes); los pushes reales del
 * editor llegan en DSS4-5.
 */
interface SignageBridgeState {
  /** Patch parcial del client recibido del editor. null = usar prop server. */
  clientPatch: Partial<SignageClientFile> | null;
  /** Patch parcial del display recibido del editor. null = usar prop server. */
  displayPatch: Partial<SignageDisplayConfig> | null;
  /** Last receive timestamp para diagnostics (DSS8). */
  lastUpdateAt: number | null;
  setClientPatch: (patch: Partial<SignageClientFile> | null) => void;
  setDisplayPatch: (patch: Partial<SignageDisplayConfig> | null) => void;
  reset: () => void;
}

export const useSignageBridgeStore = create<SignageBridgeState>((set) => ({
  clientPatch: null,
  displayPatch: null,
  lastUpdateAt: null,
  setClientPatch: (patch) => set({ clientPatch: patch, lastUpdateAt: Date.now() }),
  setDisplayPatch: (patch) => set({ displayPatch: patch, lastUpdateAt: Date.now() }),
  reset: () =>
    set({ clientPatch: null, displayPatch: null, lastUpdateAt: null }),
}));
