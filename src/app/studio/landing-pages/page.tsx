import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Refactor cliente-primero: las top-level coming-soon pages se eliminaron.
 * Landing Pages ya no aparece en la lista de productos del Studio.
 */
export default function LandingPagesRedirect() {
  redirect('/studio');
}
