import { Billboard } from '@/components/billboard/billboard';
import { BillboardLink } from '@/components/billboard/billboard-link';

interface PageProps {
  searchParams: Promise<{ variant?: string }>;
}

export default async function KioskHomePage({ searchParams }: PageProps) {
  const { variant: variantParam } = await searchParams;
  const override = variantParam ? Number(variantParam) : undefined;

  return (
    <BillboardLink>
      <Billboard variant={Number.isFinite(override) ? override : undefined} />
    </BillboardLink>
  );
}
