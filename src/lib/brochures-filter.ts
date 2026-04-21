import type { BrochureItem } from './config';

/**
 * Filtra un array de brochures por categoría y/o query.
 *   - `category`: 'all' (o undefined) no filtra; cualquier otro valor hace match exacto.
 *   - `query`: substring case-insensitive contra `title + description`.
 */
export function filterBrochures(
  brochures: readonly BrochureItem[],
  opts: { category?: string | 'all'; query?: string } = {},
): BrochureItem[] {
  const cat = opts.category;
  const q = opts.query?.trim().toLowerCase();

  return brochures.filter((b) => {
    if (cat && cat !== 'all' && b.category !== cat) return false;
    if (q) {
      const haystack = `${b.title} ${b.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}
