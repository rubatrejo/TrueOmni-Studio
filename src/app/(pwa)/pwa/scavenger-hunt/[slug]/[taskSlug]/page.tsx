import { MobileCanvas } from '@/components/pwa/mobile-canvas';
import { TaskLive } from '@/components/pwa/scavenger-hunt/task-live';
import { getConfig } from '@/lib/config';

export const dynamic = 'force-dynamic';

export default async function PwaTaskPage({
  params,
}: {
  params: Promise<{ slug: string; taskSlug: string }>;
}) {
  const { slug, taskSlug } = await params;
  const config = await getConfig();
  const sh = config.features?.pwa?.scavengerHunt;
  const hunt = sh?.hunts.find((h) => h.slug === slug);
  const task = hunt?.tasks.find((t) => t.slug === taskSlug);

  if (!sh || !hunt || !task) {
    return (
      <MobileCanvas>
        <div className="flex h-full items-center justify-center text-gray-400">Task not found</div>
      </MobileCanvas>
    );
  }

  const mapboxToken = config.integraciones?.mapbox_token ?? '';

  return (
    <MobileCanvas>
      <TaskLive
        huntSlug={slug}
        taskSlug={taskSlug}
        huntName={hunt.name}
        task={task}
        config={sh}
        totalTasks={hunt.tasks.length}
        mapboxToken={mapboxToken}
        clientName={config.client.nombre}
      />
    </MobileCanvas>
  );
}
