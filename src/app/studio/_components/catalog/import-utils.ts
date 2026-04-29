/**
 * Helpers compartidos por los editores con bulk import — merge por slug y
 * recolección de taxonomías a partir de los items importados.
 */

export function upsertBySlug<T extends { slug: string }>(
  existing: T[],
  incoming: T[],
): T[] {
  const incomingMap = new Map(incoming.map((it) => [it.slug, it]));
  const result: T[] = [];
  const seen = new Set<string>();

  // mantener orden de existentes; reemplazar por la versión incoming si hay match
  for (const it of existing) {
    if (incomingMap.has(it.slug)) {
      result.push(incomingMap.get(it.slug) as T);
      seen.add(it.slug);
    } else {
      result.push(it);
    }
  }
  // appendear los nuevos al final, preservando el orden del payload
  for (const it of incoming) {
    if (!seen.has(it.slug)) {
      result.push(it);
      seen.add(it.slug);
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
