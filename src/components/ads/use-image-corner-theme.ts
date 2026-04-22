'use client';

import { useEffect, useState } from 'react';

import type { AdTheme } from '@/lib/config';

/**
 * Detecta el tono (light/dark) del fondo de una imagen en una región dada.
 *
 * Carga la imagen en un canvas offscreen, samplea una esquina (por defecto
 * upper-right 25%×25% — donde vive el botón X del ad) y calcula la
 * luminancia perceptual (coeficientes Rec. 601: 0.299·R + 0.587·G + 0.114·B).
 *
 *   Luminancia > 160 → 'light' (X negra).
 *   Luminancia ≤ 160 → 'dark'  (X blanca).
 *
 * Los assets del kiosk se sirven desde `/assets/*` (mismo origin que la app),
 * así que no hay problemas de CORS con `canvas.getImageData`.
 *
 * Si falla (imagen no carga, canvas roto, CORS), retorna `'dark'` por default.
 * Cachea el resultado por URL en memoria — el hook sólo hace el sample una
 * vez por imagen por vida del módulo.
 */
const cache = new Map<string, AdTheme>();

export interface CornerRegion {
  /** Fracciones 0-1 del bounding box de la imagen. */
  x: number;
  y: number;
  w: number;
  h: number;
}

const DEFAULT_CORNER: CornerRegion = { x: 0.75, y: 0, w: 0.25, h: 0.25 };

export function useImageCornerTheme(
  url: string | undefined,
  corner: CornerRegion = DEFAULT_CORNER,
): AdTheme {
  const [theme, setTheme] = useState<AdTheme>(() => (url && cache.get(url)) || 'dark');

  useEffect(() => {
    if (!url) return;
    const cached = cache.get(url);
    if (cached) {
      setTheme(cached);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      try {
        const sx = Math.floor(img.naturalWidth * corner.x);
        const sy = Math.floor(img.naturalHeight * corner.y);
        const sw = Math.max(1, Math.floor(img.naturalWidth * corner.w));
        const sh = Math.max(1, Math.floor(img.naturalHeight * corner.h));
        const canvas = document.createElement('canvas');
        canvas.width = sw;
        canvas.height = sh;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
        const data = ctx.getImageData(0, 0, sw, sh).data;
        let total = 0;
        let n = 0;
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i + 3];
          if (a < 10) continue; // skip transparent
          total += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          n++;
        }
        if (n === 0) return;
        const avg = total / n;
        const result: AdTheme = avg > 160 ? 'light' : 'dark';
        cache.set(url, result);
        if (!cancelled) setTheme(result);
      } catch {
        /* canvas/CORS fail — mantiene default 'dark' */
      }
    };
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [url, corner.x, corner.y, corner.w, corner.h]);

  return theme;
}
