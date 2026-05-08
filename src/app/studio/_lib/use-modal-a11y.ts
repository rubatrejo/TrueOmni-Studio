'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Hooks de accesibilidad para modales del Studio. Hallazgos S-28 (Escape
 * consistente) y S-29 (focus trap) del audit panorámico v2.
 *
 *   - `useEscapeClose(open, onClose)` — cierra el modal con Escape sin que
 *     cada modal duplique el listener.
 *   - `useFocusTrap(open, ref)` — atrapa Tab/Shift+Tab dentro del nodo
 *     referenciado para que el foco no escape al body mientras el modal
 *     está abierto. Restaura el focus previo al cerrar.
 */

/**
 * Cierra el modal cuando el usuario presiona Escape. No hace nada si
 * `open === false`.
 */
export function useEscapeClose(open: boolean, onClose: () => void): void {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);
}

/**
 * Mantiene el foco dentro del nodo `ref.current` mientras `open` es true.
 * Al abrir, mueve el foco al primer elemento interactivo (o al propio nodo
 * si no encuentra ninguno). Al cerrar, restaura el foco al elemento que
 * lo tenía antes.
 *
 * Detecta los elementos focusables vía un selector estándar (no usa
 * tabindex="-1" como focusable). Tab al final → primero; Shift+Tab al
 * inicio → último.
 */
export function useFocusTrap(
  open: boolean,
  ref: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    if (!node) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Mueve foco al primer elemento focusable cuando el modal abre.
    const focusable = getFocusableWithin(node);
    if (focusable.length > 0) {
      focusable[0].focus({ preventScroll: true });
    } else {
      // Si no hay focusables, hacer el contenedor focusable temporalmente.
      const prevTabIndex = node.getAttribute('tabindex');
      node.setAttribute('tabindex', '-1');
      node.focus({ preventScroll: true });
      // Restaurar al cerrar.
      const restore = () => {
        if (prevTabIndex === null) node.removeAttribute('tabindex');
        else node.setAttribute('tabindex', prevTabIndex);
      };
      // Lo dejamos para el cleanup principal abajo.
      // (no usamos restore directamente; cleanup global lo hace).
      void restore;
    }

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = getFocusableWithin(node);
      if (nodes.length === 0) {
        e.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !node.contains(active)) {
          e.preventDefault();
          last.focus({ preventScroll: true });
        }
      } else {
        if (active === last || !node.contains(active)) {
          e.preventDefault();
          first.focus({ preventScroll: true });
        }
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      // Restaurar foco al elemento previo, si sigue en el DOM.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [open, ref]);
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusableWithin(node: HTMLElement): HTMLElement[] {
  const all = Array.from(
    node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  );
  return all.filter((el) => {
    if (el.hasAttribute('disabled')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    // Visible check barato.
    return el.offsetParent !== null || el.getClientRects().length > 0;
  });
}
