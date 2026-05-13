'use client';

import { create } from 'zustand';

import type { SignageEvent, SignageNewsConfig, SignageSocialData } from '@/lib/signage/schema';
import type { VideoWallClientFile, VideoWallConfig } from '@/lib/video-walls/schema';

/**
 * Store zustand del bridge runtime de Video Walls.
 *
 * El `<VideoWallBridge>` escucha postMessage del editor Studio y popula este
 * store. El runtime lee los patches con fallback a la prop del server (mismo
 * patrón híbrido que el bridge signage).
 *
 * Mantiene namespace `videowall:*` para no colisionar con el signage bridge
 * cuando ambos productos comparten pestaña (e.g. preview embed).
 */
interface VideoWallBridgeState {
  /** Patch parcial del client recibido del editor. null = usar prop server. */
  clientPatch: Partial<VideoWallClientFile> | null;
  /** Patch parcial del wall recibido del editor. null = usar prop server. */
  wallPatch: Partial<VideoWallConfig> | null;
  /**
   * Patches de contenido (events/social/news). Viven separados del
   * `clientPatch` porque se guardan por endpoints independientes del KV
   * y el shape `VideoWallClientFile` no los incluye (van en el `Resolved`).
   */
  eventsPatch: SignageEvent[] | null;
  socialPatch: SignageSocialData | null;
  newsPatch: SignageNewsConfig | null;
  /** Last receive timestamp para diagnostics. */
  lastUpdateAt: number | null;
  setClientPatch: (patch: Partial<VideoWallClientFile> | null) => void;
  setWallPatch: (patch: Partial<VideoWallConfig> | null) => void;
  setEventsPatch: (patch: SignageEvent[] | null) => void;
  setSocialPatch: (patch: SignageSocialData | null) => void;
  setNewsPatch: (patch: SignageNewsConfig | null) => void;
  reset: () => void;
}

export const useVideoWallBridgeStore = create<VideoWallBridgeState>((set) => ({
  clientPatch: null,
  wallPatch: null,
  eventsPatch: null,
  socialPatch: null,
  newsPatch: null,
  lastUpdateAt: null,
  setClientPatch: (patch) => set({ clientPatch: patch, lastUpdateAt: Date.now() }),
  setWallPatch: (patch) => set({ wallPatch: patch, lastUpdateAt: Date.now() }),
  setEventsPatch: (patch) => set({ eventsPatch: patch, lastUpdateAt: Date.now() }),
  setSocialPatch: (patch) => set({ socialPatch: patch, lastUpdateAt: Date.now() }),
  setNewsPatch: (patch) => set({ newsPatch: patch, lastUpdateAt: Date.now() }),
  reset: () =>
    set({
      clientPatch: null,
      wallPatch: null,
      eventsPatch: null,
      socialPatch: null,
      newsPatch: null,
      lastUpdateAt: null,
    }),
}));
