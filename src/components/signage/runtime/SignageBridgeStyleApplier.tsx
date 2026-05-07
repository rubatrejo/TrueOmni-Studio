'use client';

import { useEffect, useRef } from 'react';

import { useSignageBridgeStore } from './signage-bridge-store';

/**
 * `<SignageBridgeStyleApplier>` — Aplica live al iframe los tokens CSS que
 * envía el editor del Studio vía bridge postMessage.
 *
 * Cómo funciona:
 *  1. Lee `clientPatch.branding.tokens` del store del bridge (populado por
 *     `<SignageBridge>` cuando recibe `signage:client-update`).
 *  2. Por cada `(key, value)` aplica
 *     `document.documentElement.style.setProperty('--signage-' + key, value)`.
 *     Override de CSS variables a nivel root → cascade recolorea todo el
 *     árbol signage que consume `hsl(var(--signage-*))`.
 *  3. Al cambiar el patch limpia las keys que ya no aparecen.
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

    // Aplica nuevas / actualizadas.
    for (const [key, value] of Object.entries(tokens)) {
      const cssVar = `--signage-${key}`;
      root.style.setProperty(cssVar, value);
      nextKeys.add(cssVar);
    }

    // Limpia las que estaban antes y ya no.
    for (const cssVar of appliedKeysRef.current) {
      if (!nextKeys.has(cssVar)) {
        root.style.removeProperty(cssVar);
      }
    }

    appliedKeysRef.current = nextKeys;
  }, [clientPatch]);

  return null;
}
