import Link from 'next/link';

import { Billboard } from '@/components/billboard/billboard';

interface PageProps {
  searchParams: Promise<{ variant?: string }>;
}

export default async function KioskHomePage({ searchParams }: PageProps) {
  const { variant: variantParam } = await searchParams;
  const override = variantParam ? Number(variantParam) : undefined;

  return (
    <Link
      href="/home"
      aria-label="Tocar para empezar — abre el Main Dashboard"
      className="block focus:outline-none"
    >
      <Billboard variant={Number.isFinite(override) ? override : undefined} />
    </Link>
  );
}
