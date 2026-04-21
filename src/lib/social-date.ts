/**
 * Formatea una fecha ISO como "X time ago" estilo redes sociales.
 *   - < 1 min  → "just now"
 *   - < 1 h    → "N minutes ago" / "1 minute ago"
 *   - < 24 h   → "N hours ago"    / "1 hour ago"
 *   - < 7 d    → "N days ago"     / "1 day ago"
 *   - < 4 sem  → "N weeks ago"    / "1 week ago"
 *   - >=4 sem  → "April 21, 2026" (fecha absoluta)
 */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return iso;

  const diffSec = Math.max(0, Math.floor((now.getTime() - then.getTime()) / 1000));

  if (diffSec < 60) return 'just now';
  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return days === 1 ? '1 day ago' : `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  return `${months[then.getMonth()]} ${then.getDate()}, ${then.getFullYear()}`;
}
