import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Redirecting · TrueOmni Studio',
};

/**
 * Redirect compat: el dashboard global de Digital Displays se reemplazó por
 * el dashboard de Clientes. Cada cliente tiene su propio sub-dashboard de
 * Digital Displays en `/studio/[slug]/digital-displays`.
 */
export default function DigitalDisplaysRootRedirect() {
  redirect('/studio');
}
