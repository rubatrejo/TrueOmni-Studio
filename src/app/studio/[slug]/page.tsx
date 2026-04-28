import { notFound } from 'next/navigation';

import { kv, kvKeys } from '@/lib/studio/kv';
import { type ConfigMeta, type KioskConfig } from '@/lib/studio/schema';

import { Shell } from '../_components/Shell';

export default async function StudioEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const config = await kv.get<KioskConfig>(kvKeys.cfg(slug));
  if (!config) notFound();
  const meta = await kv.get<ConfigMeta>(kvKeys.cfgMeta(slug));

  return <Shell initialConfig={config} initialMeta={meta} />;
}

export const dynamic = 'force-dynamic';
