/**
 * Helpers compartidos por los editores con bulk import — merge por slug y
 * recolección de taxonomías a partir de los items importados.
 */

export function upsertBySlug<T extends { slug: string }>(existing: T[], incoming: T[]): T[] {
  return upsertByKey(existing, incoming, 'slug');
}

export function upsertById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  return upsertByKey(existing, incoming, 'id');
}

function upsertByKey<T extends Record<string, unknown>>(
  existing: T[],
  incoming: T[],
  field: string,
): T[] {
  const incomingMap = new Map(incoming.map((it) => [it[field] as string, it]));
  const result: T[] = [];
  const seen = new Set<string>();

  for (const it of existing) {
    const key = it[field] as string;
    if (incomingMap.has(key)) {
      result.push(incomingMap.get(key) as T);
      seen.add(key);
    } else {
      result.push(it);
    }
  }
  for (const it of incoming) {
    const key = it[field] as string;
    if (!seen.has(key)) {
      result.push(it);
      seen.add(key);
    }
  }
  return result;
}

/**
 * Si `current` está vacío y los items aportan valores en `field`, recolecta un
 * set ordenado (max `cap` entradas). Si ya hay taxonomía, la deja intacta.
 */
export function mergeTaxonomy<T>(
  current: string[],
  items: T[],
  pick: (item: T) => string | string[] | undefined,
  cap = 100,
): string[] {
  if (current.length > 0) return current;
  const set = new Set<string>();
  for (const it of items) {
    const v = pick(it);
    if (!v) continue;
    if (Array.isArray(v)) {
      v.forEach((s) => {
        const trimmed = s.trim();
        if (trimmed) set.add(trimmed.slice(0, 64));
      });
    } else {
      const trimmed = v.trim();
      if (trimmed) set.add(trimmed.slice(0, 64));
    }
  }
  return Array.from(set).sort().slice(0, cap);
}
