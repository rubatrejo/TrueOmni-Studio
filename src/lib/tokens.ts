/**
 * Catálogo de nombres de token disponibles en `clients/{slug}/tokens.css`.
 * Se usa para referencias tipadas a `var(--...)` sin strings mágicos.
 * NO hay validación runtime — los tokens viven solo en CSS.
 */

export const TOKEN_COLORS = [
  'background',
  'foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'accent',
  'accent-foreground',
  'muted',
  'muted-foreground',
  'border',
  'input',
  'ring',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'success',
  'warning',
  'destructive',
  'destructive-foreground',
] as const;
export type TokenColor = (typeof TOKEN_COLORS)[number];

export const TOKEN_LAYOUT = [
  'kiosk-width',
  'kiosk-height',
  'safe-area-top',
  'safe-area-bottom',
  'safe-area-x',
] as const;
export type TokenLayout = (typeof TOKEN_LAYOUT)[number];
