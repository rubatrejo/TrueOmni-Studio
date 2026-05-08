import Link from 'next/link';

/**
 * Stub visual para productos del cliente que aún no están construidos.
 * Muestra el nombre del producto + badge "Coming soon" + link de regreso a
 * la vista del cliente. Se usa para Mobile PWA, Video Walls y Tablets.
 */
export interface ComingSoonProps {
  slug: string;
  product: 'Mobile PWA' | 'Video Walls' | 'Tablets';
  description: string;
}

export function ComingSoon({ slug, product, description }: ComingSoonProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <div className="max-w-md text-center">
        <span className="inline-flex items-center rounded-full bg-zinc-200 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          Coming soon
        </span>
        <h1 className="mt-4 font-display text-3xl font-semibold text-zinc-900 dark:text-white">
          {product}
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
        <Link
          href={`/studio/${slug}`}
          className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium text-zinc-900 underline-offset-4 transition hover:underline dark:text-zinc-100"
        >
          ← Back to client
        </Link>
      </div>
    </div>
  );
}
