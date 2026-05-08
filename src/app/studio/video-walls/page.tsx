import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

/**
 * Refactor cliente-primero: Video Walls ahora vive bajo cada cliente en
 * `/studio/[slug]/video-walls`. La URL antigua redirige al dashboard de
 * clientes.
 */
export default function VideoWallsRootRedirect() {
  redirect('/studio');
}
