'use client';

import { useEffect, useRef } from 'react';

import type { SignageCustomFont } from '@/lib/signage/schema';

import { useSignageBridgeStore } from './signage-bridge-store';

const injectedFonts = new Set<string>();
function injectGoogleFont(family: string) {
  if (typeof document === 'undefined') return;
  if (injectedFonts.has(family)) return;
  injectedFonts.add(family);
  const id = `signage-font-${family.replace(/\s+/g, '-').toLowerCase()}`;
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
  const id = `signage-custom-font-${font.name.replace(/\s+/g, '-').toLowerCase()}`;
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
 * `<SignageBridgeStyleApplier>` — Aplica live al iframe los tokens CSS, fonts
 * y demás overrides de branding que envía el editor del Studio vía bridge
 * postMessage.
 *
 * Cómo funciona:
 *  1. Tokens CSS (`branding.tokens`): cada `(key, value)` se aplica como
 *     `document.documentElement.style.setProperty('--signage-' + key, value)`.
 *     Cascade recolorea el árbol signage que consume `hsl(var(--signage-*))`.
 *  2. Fonts (`branding.fonts.default` / `display`): inyecta el `<link>` de
 *     Google Fonts y aplica `--signage-font-body` / `--signage-font-display`
 *     al `:root`, además de `font-family` directamente al `body` para que
 *     todo el runtime herede la familia activa.
 *  3. Limpia las keys que estaban antes y ya no aparecen.
 *
 * Solo aplica overrides cuando el iframe está embebido en un editor
 * (`window.parent !== window`). En vista standalone no hay patches, así que
 * no hace nada.
 */
export function SignageBridgeStyleApplier() {
  const clientPatch = useSignageBridgeStore((s) => s.clientPatch);
  const appliedKeysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const root = document.documentElement;
    const tokens = clientPatch?.branding?.tokens ?? {};
    const nextKeys = new Set<string>();

    // 1. Tokens.
    for (const [key, value] of Object.entries(tokens)) {
      const cssVar = `--signage-${key}`;
      root.style.setProperty(cssVar, value);
      nextKeys.add(cssVar);
    }

    // 2. Fonts (Google) + custom @font-face.
    const fonts = clientPatch?.branding?.fonts;
    if (fonts) {
      // Custom display font tiene prioridad sobre Google display.
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

      // Custom body font tiene prioridad sobre Google body.
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

    // 3. Limpia las que estaban antes y ya no.
    for (const cssVar of appliedKeysRef.current) {
      if (!nextKeys.has(cssVar)) {
        root.style.removeProperty(cssVar);
      }
    }

    appliedKeysRef.current = nextKeys;
  }, [clientPatch]);

  return null;
}
