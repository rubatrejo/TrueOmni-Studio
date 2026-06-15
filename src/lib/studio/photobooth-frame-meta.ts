/**
 * Metadata client-safe de los frames branded del Photo Booth (SIN `server-only`,
 * para que la pueda importar tanto el generador server-side como el editor del
 * Studio). Indica qué frames llevan TEXTO editable por frame y de qué tipo, y
 * computa el default basado en el nombre del cliente.
 *
 * El render real (sharp/SVG) vive en `photobooth-frame-templates.ts`.
 */

export type FrameTextKind = 'phrase' | 'hashtag';

/** templateId → tipo de texto editable que hornea ese frame. */
export const FRAME_TEXT_KIND: Readonly<Record<string, FrameTextKind>> = {
  'branded-top-bottom-bands': 'hashtag', // Bands → hashtag en la banda inferior
  'branded-angled-band': 'phrase', // Angled → frase abajo-derecha
  'branded-solid-border-tab': 'phrase', // Border Tab → frase centrada abajo
  'branded-diagonal-corners': 'phrase', // Diagonal → frase arriba-izquierda
};

/** ¿Esta plantilla lleva texto editable por frame? */
export function isTextFrame(templateId?: string): boolean {
  return !!templateId && templateId in FRAME_TEXT_KIND;
}

/** Default del texto basado en el nombre del cliente ("Visit + Cliente"). */
export function defaultFrameText(kind: FrameTextKind, clientName: string): string {
  const name = clientName.trim() || 'Us';
  if (kind === 'hashtag') {
    const compact = name.replace(/[^a-zA-Z0-9]/g, '');
    return `#Visit${compact || 'Us'}`;
  }
  return `Visit ${name}`;
}
