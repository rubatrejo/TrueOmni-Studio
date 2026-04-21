import type { HomeListing } from './config';

/** Filtro case-insensitive sobre `title`. Devuelve máx `limit` matches. */
export function filterListings(
  all: readonly HomeListing[],
  query: string,
  limit = 20,
): HomeListing[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return all.filter((l) => l.title.toLowerCase().includes(q)).slice(0, limit);
}
