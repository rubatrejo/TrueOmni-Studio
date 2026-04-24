'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Blob-URL lifecycle helper para el Photo Booth. Crea `URL.createObjectURL()`
 * para un Blob y lo limpia cuando se reemplaza o el componente se desmonta.
 * Evita memory leaks en sesiones largas.
 */
export function usePhotoSession() {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const currentRef = useRef<string | null>(null);

  const setBlob = useCallback((blob: Blob | null) => {
    if (currentRef.current) {
      URL.revokeObjectURL(currentRef.current);
      currentRef.current = null;
    }
    if (blob) {
      const url = URL.createObjectURL(blob);
      currentRef.current = url;
      setBlobUrl(url);
    } else {
      setBlobUrl(null);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (currentRef.current) {
        URL.revokeObjectURL(currentRef.current);
        currentRef.current = null;
      }
    };
  }, []);

  return { blobUrl, setBlob };
}
