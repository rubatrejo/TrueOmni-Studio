'use client';

import { useEffect, useRef } from 'react';

import type { SignageCustomFont } from '@/lib/signage/schema';

import { useVideoWallBridgeStore } from './video-wall-bridge-store';

const injectedFonts = new Set<string>();
function injectGoogleFont(family: string) {
  if (typeof document === 'undefined') return;
  if (injectedFonts.has(family)) return;
  injectedFonts.add(family);
  const id = `videowall-font-${family.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

const CSS_FORMAT_BY_EXT: Record<SignageCustomFont['format'], string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
};

function injectCustomFontFace(font: SignageCustomFont) {
  if (typeof document === 'undefined') return;
  const id = `videowall-custom-font-${font.name.replace(/\s+/g, '-').toLowerCase()}`;
  const existing = document.getElementById(id) as HTMLStyleElement | null;
  if (existing) {
    if (existing.dataset.fontHash === font.dataUrl.length.toString()) return;
    existing.remove();
  }
  const cssFormat = CSS_FORMAT_BY_EXT[font.format] ?? font.format;
  const style = document.createElement('style');
  style.id = id;
  style.dataset.fontHash = font.dataUrl.length.toString();
  style.textContent = `@font-face {
  font-family: "${font.name}";
  src: url(${font.dataUrl}) format("${cssFormat}");
  font-display: swap;
}`;
  document.head.appendChild(style);
}

/**
 * `<VideoWallBridgeStyleApplier>` — Aplica live al iframe los tokens CSS y
 * fonts que envía el editor del Studio.
 *
 * El runtime de Video Walls consume los mismos tokens `--signage-*` que el
 * signage (un cliente con ambos productos comparte branding via KV signage).
 * Por eso el applier escribe sobre `--signage-*`, no sobre un namespace
 * `--videowall-*` separado.
 *
 * Cómo funciona:
 *  1. Tokens CSS (`branding.tokens`): cada `(key, value)` se aplica como
 *     `document.documentElement.style.setProperty('--signage-' + key, value)`.
 *  2. Fonts (`branding.fonts.default` / `display`): inyecta el `<link>` de
 *     Google Fonts y aplica `--signage-font-body` / `--signage-font-display`
 *     al `:root`, además de `font-family` al `body`.
 *  3. Limpia las keys que estaban antes y ya no aparecen.
 */
export function VideoWallBridgeStyleApplier() {
  const clientPatch = useVideoWallBridgeStore((s) => s.clientPatch);
  const appliedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const root = document.documentElement;
    const tokens = clientPatch?.branding?.tokens ?? {};
    const nextKeys = new Set<string>();

    for (const [key, value] of Object.entries(tokens)) {
      const cssVar = `--signage-${key}`;
      root.style.setProperty(cssVar, value);
      nextKeys.add(cssVar);
    }

    const fonts = clientPatch?.branding?.fonts;
    if (fonts) {
      if (fonts.displayCustom) {
        injectCustomFontFace(fonts.displayCustom);
        const fam = `"${fonts.displayCustom.name}", system-ui, sans-serif`;
        root.style.setProperty('--signage-font-display', fam);
        nextKeys.add('--signage-font-display');
      } else if (fonts.display) {
        injectGoogleFont(fonts.display);
        root.style.setProperty(
          '--signage-font-display',
          `"${fonts.display}", system-ui, sans-serif`,
        );
        nextKeys.add('--signage-font-display');
      }

      if (fonts.bodyCustom) {
        injectCustomFontFace(fonts.bodyCustom);
        const fam = `"${fonts.bodyCustom.name}", system-ui, sans-serif`;
        root.style.setProperty('--signage-font-body', fam);
        document.body.style.fontFamily = fam;
        nextKeys.add('--signage-font-body');
      } else if (fonts.body) {
        injectGoogleFont(fonts.body);
        const fam = `"${fonts.body}", system-ui, sans-serif`;
        root.style.setProperty('--signage-font-body', fam);
        document.body.style.fontFamily = fam;
        nextKeys.add('--signage-font-body');
      }
    }

    for (const cssVar of appliedKeysRef.current) {
      if (!nextKeys.has(cssVar)) {
        root.style.removeProperty(cssVar);
      }
    }

    appliedKeysRef.current = nextKeys;
  }, [clientPatch]);

  return null;
}
