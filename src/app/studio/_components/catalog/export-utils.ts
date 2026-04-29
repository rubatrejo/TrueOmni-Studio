'use client';

import {
  serializeCatalog,
  type ImportItem,
  type ImportKind,
} from '@/app/studio/_lib/import-helpers';

/**
 * Genera el archivo y dispara la descarga en el navegador.
 */
export function downloadCatalog<K extends ImportKind>(
  kind: K,
  items: ImportItem<K>[],
  format: 'csv' | 'json',
  filenameStem?: string,
): void {
  const text = serializeCatalog(kind, items, format);
  const mime = format === 'csv' ? 'text/csv' : 'application/json';
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const stem = filenameStem ?? kind;
  const a = document.createElement('a');
  a.href = url;
  a.download = `${stem}-${stamp}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}
