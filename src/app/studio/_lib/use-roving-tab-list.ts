'use client';

import { useRef, type KeyboardEvent } from 'react';

/**
 * `useRovingTabList` — roving-tabindex para listas `role="tablist"` del Studio
 * (F-QA-3 del audit STUDIO-AUDIT-2026-06-09).
 *
 * Antes vivía copiado casi idéntico en tres sitios (SidebarTabs del kiosk,
 * TabStrip horizontal, SignageSidebarTabs), con el riesgo de drift que ya
 * mordió a Breadcrumb/SaveStatusPill. Este hook centraliza:
 *  - el array de refs de los botones tab,
 *  - la navegación por teclado (ArrowUp/Down/Left/Right = mismo eje lógico,
 *    Home/End),
 *  - el patrón "focus + select" del tab destino.
 *
 * `isDisabled(idx)` es opcional: cuando se pasa (kiosk), la navegación SALTA los
 * tabs deshabilitados; sin él, el wrap es simple por módulo — comportamiento
 * idéntico al de TabStrip/SignageSidebarTabs previo.
 */
export function useRovingTabList({
  count,
  onSelect,
  isDisabled,
}: {
  count: number;
  /** Activa el tab `idx` (el caller mapea idx → key y llama a su onSelect). */
  onSelect: (idx: number) => void;
  /** Predicado opcional de deshabilitado; si se omite, ningún tab se salta. */
  isDisabled?: (idx: number) => boolean;
}) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const disabled = (idx: number) => (isDisabled ? isDisabled(idx) : false);

  const move = (target: number) => {
    if (target < 0 || target >= count || disabled(target)) return;
    onSelect(target);
    buttonRefs.current[target]?.focus();
  };

  const nextEnabled = (start: number, dir: 1 | -1): number => {
    if (count === 0) return start;
    for (let step = 1; step <= count; step++) {
      const i = (start + dir * step + count) % count;
      if (!disabled(i)) return i;
    }
    return start;
  };

  const firstEnabled = (): number => {
    for (let i = 0; i < count; i++) if (!disabled(i)) return i;
    return 0;
  };

  const lastEnabled = (): number => {
    for (let i = count - 1; i >= 0; i--) if (!disabled(i)) return i;
    return count - 1;
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIdx: number) => {
    if (count === 0) return;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        move(nextEnabled(currentIdx, 1));
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        move(nextEnabled(currentIdx, -1));
        break;
      case 'Home':
        e.preventDefault();
        move(firstEnabled());
        break;
      case 'End':
        e.preventDefault();
        move(lastEnabled());
        break;
    }
  };

  return { buttonRefs, handleKeyDown };
}
