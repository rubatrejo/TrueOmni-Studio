import { BillboardLink } from '@/components/billboard/billboard-link';
import { BillboardLiveSwitcher } from '@/components/billboard/billboard-live-switcher';
import { KioskCanvas } from '@/components/kiosk-canvas';
import { getConfig } from '@/lib/config';

interface PageProps {
  searchParams: Promise<{ variant?: string }>;
}

export default async function KioskHomePage({ searchParams }: PageProps) {
  const { variant: variantParam } = await searchParams;
  const override = variantParam ? Number(variantParam) : undefined;
  const config = await getConfig();
  const fromConfig = config.features?.billboard_variant;
  const raw =
    typeof override === 'number' && Number.isFinite(override)
      ? override
      : typeof fromConfig === 'number'
        ? fromConfig
        : 0;
  const initial = (raw >= 0 && raw <= 4 ? raw : 0) as 0 | 1 | 2 | 3 | 4;
  // Módulo Languages: el idle oculta el selector de idioma si está desactivado
  // (y pone el "Powered by" en su lugar en las variantes 2/3/4).
  const languagesEnabled = config.features?.languages?.enabled ?? true;

  return (
    <BillboardLink>
      <KioskCanvas>
        <BillboardLiveSwitcher initial={initial} languagesEnabled={languagesEnabled} />
      </KioskCanvas>
    </BillboardLink>
  );
}
