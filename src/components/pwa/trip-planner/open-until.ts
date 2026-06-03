/**
 * Deriva "Open until 11:00 pm" para una card del Trip Planner.
 * - listings/trails: a partir del string `hours` ("7 am – 11 pm").
 * - events: a partir de `endTime` ('HH:MM' 24h).
 */
function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  if (h === undefined || Number.isNaN(h) || m === undefined || Number.isNaN(m)) return '';
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export function openUntilLabel(prefix: string, hours?: string, endTime?: string): string {
  if (hours) {
    const close = hours.split(/[–-]/).pop()?.trim() ?? '';
    const norm = close.replace(/^(\d+)\s*(am|pm)$/i, '$1:00 $2');
    return norm ? `${prefix} ${norm}` : '';
  }
  if (endTime) {
    const t = to12h(endTime);
    return t ? `${prefix} ${t}` : '';
  }
  return '';
}
