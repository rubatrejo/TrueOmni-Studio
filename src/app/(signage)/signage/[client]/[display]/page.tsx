import { notFound } from 'next/navigation';

import { SignagePlaceholder } from '@/components/signage/runtime/SignagePlaceholder';
import { SignageStage } from '@/components/signage/stage/SignageStage';
import { loadSignageClient, loadSignageDisplay } from '@/lib/signage/config';

interface PageProps {
  params: Promise<{ client: string; display: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const dynamic = 'force-dynamic';

export default async function SignageDisplayPage({ params, searchParams }: PageProps) {
  const { client: clientSlug, display: displaySlug } = await params;
  const search = await searchParams;
  const debug = search?.debug === '1';

  const [clientCfg, displayCfg] = await Promise.all([
    loadSignageClient(clientSlug),
    loadSignageDisplay(clientSlug, displaySlug),
  ]);

  if (!clientCfg || !displayCfg) {
    notFound();
  }

  return (
    <SignageStage debug={debug}>
      <SignagePlaceholder client={clientCfg} display={displayCfg} />
    </SignageStage>
  );
}
