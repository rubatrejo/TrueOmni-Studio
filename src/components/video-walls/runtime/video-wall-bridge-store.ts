'use client';

import { create } from 'zustand';

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
  /** Last receive timestamp para diagnostics. */
  lastUpdateAt: number | null;
  setClientPatch: (patch: Partial<VideoWallClientFile> | null) => void;
  setWallPatch: (patch: Partial<VideoWallConfig> | null) => void;
  reset: () => void;
}

export const useVideoWallBridgeStore = create<VideoWallBridgeState>((set) => ({
  clientPatch: null,
  wallPatch: null,
  lastUpdateAt: null,
  setClientPatch: (patch) => set({ clientPatch: patch, lastUpdateAt: Date.now() }),
  setWallPatch: (patch) => set({ wallPatch: patch, lastUpdateAt: Date.now() }),
  reset: () => set({ clientPatch: null, wallPatch: null, lastUpdateAt: null }),
}));
