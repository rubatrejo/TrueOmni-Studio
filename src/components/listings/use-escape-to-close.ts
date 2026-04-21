'use client';

import { useEffect } from 'react';

/**
 * Cierra un overlay al presionar Escape mientras está abierto.
 * Se activa sólo cuando `open` es true — sin listener residual al cerrar.
 */
export function useEscapeToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}
