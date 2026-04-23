import type { Deal } from './config';

/** Orden del listado de deals. Default del módulo = 'expiring-soon'. */
export type DealSortOrder = 'expiring-soon' | 'recent' | 'a-z' | 'best-discount';

export interface DealSortOption {
  value: DealSortOrder;
  label: string;
}

export const DEAL_SORT_OPTIONS: DealSortOption[] = [
  { value: 'expiring-soon', label: 'Expiring Soon' },
  { value: 'recent', label: 'Recently Added' },
  { value: 'a-z', label: 'A – Z' },
  { value: 'best-discount', label: 'Best Discount' },
];

export interface DealsFilterState {
  /** AND — un deal pasa el filtro si contiene TODAS las features seleccionadas. */
  features: string[];
}

export const EMPTY_DEALS_FILTER: DealsFilterState = { features: [] };

/**
 * Devuelve solo los deals cuya fecha de expiración es hoy o futura.
 * Usa `YYYY-MM-DD` en local time — el cliente declara su timezone aparte.
 */
export function filterActiveDeals(deals: readonly Deal[], nowISO: string = todayISO()): Deal[] {
  return deals.filter((d) => d.expiresAt >= nowISO);
}

/** AND de features. Si no hay features seleccionadas, no filtra. */
export function applyDealsFilter(deals: readonly Deal[], filter: DealsFilterState): Deal[] {
  if (filter.features.length === 0) return [...deals];
  return deals.filter((d) => filter.features.every((f) => d.features.includes(f)));
}

/** Sort estable según `DealSortOrder`. Devuelve copia. */
export function sortDeals(deals: readonly Deal[], order: DealSortOrder): Deal[] {
  const arr = [...deals];
  switch (order) {
    case 'expiring-soon':
      return arr.sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));
    case 'recent':
      // Sin `createdAt`, interpretamos "recent" como el orden declarativo del config
      // pero mantenemos estabilidad: reverso del orden de expiración (los que expiran
      // más tarde suelen ser los más recién añadidos). Si el cliente quiere un orden
      // específico, que los declare ya ordenados en el config.
      return arr.sort((a, b) => b.expiresAt.localeCompare(a.expiresAt));
    case 'a-z':
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case 'best-discount':
      return arr.sort((a, b) => (b.discountValue ?? 0) - (a.discountValue ?? 0));
  }
}

/** Búsqueda case-insensitive sobre title + shortDescription. */
export function searchDeals(deals: readonly Deal[], query: string): Deal[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [...deals];
  return deals.filter(
    (d) => d.title.toLowerCase().includes(q) || d.shortDescription.toLowerCase().includes(q),
  );
}

/** Catálogo de features único derivado del pool de deals (fallback cuando el módulo no declara `featureCatalog`). */
export function deriveDealFeatures(deals: readonly Deal[]): string[] {
  const set = new Set<string>();
  for (const d of deals) for (const f of d.features) set.add(f);
  return [...set].sort();
}

/** 'YYYY-MM-DD' en timezone local del servidor. */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Formatea 'YYYY-MM-DD' como "M/D/YY" (US short). Usado por las cards
 * (ej. "7/28/25"). Si la fecha es inválida devuelve el input tal cual.
 */
export function formatDealExpiry(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const [, yyyy, mm, dd] = match;
  const y = yyyy.slice(2);
  const m = String(parseInt(mm, 10));
  const d = String(parseInt(dd, 10));
  return `${m}/${d}/${y}`;
}
