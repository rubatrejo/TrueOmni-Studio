import { Billboard } from '@/components/billboard/billboard';
import { BillboardDevNav } from '@/components/billboard/billboard-dev-nav';

interface PageProps {
  searchParams: Promise<{ variant?: string }>;
}

export default async function KioskHomePage({ searchParams }: PageProps) {
  const { variant: variantParam } = await searchParams;
  const override = variantParam ? Number(variantParam) : undefined;
  const isDev = process.env.NODE_ENV !== 'production';

  return (
    <>
      <Billboard variant={Number.isFinite(override) ? override : undefined} />
      {isDev ? <BillboardDevNav /> : null}
    </>
  );
}
