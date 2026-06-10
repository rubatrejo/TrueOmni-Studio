'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Monitor, Smartphone, Tablet, Tv, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { findPalette } from '../_lib/preset-palettes';
import { STARTERS } from '../_lib/starters';
import { useEscapeClose, useFocusTrap } from '../_lib/use-modal-a11y';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$|^[a-z0-9]$/;
// F-HUB-8: "City" o "City, Region/Country" — ya no solo US state de 2 letras.
// Nominatim geocodifica cualquier query, así que aceptamos clientes
// internacionales ("Paris, France", "Tokyo", "São Paulo, Brazil").
const LOCATION_REGEX = /^[\p{L}][\p{L} .'-]{1,60}(,\s*[\p{L}][\p{L} .'-]{1,60})?$/u;

export type ProductId = 'kiosks' | 'digitalDisplays' | 'mobilePwa' | 'videoWalls' | 'tablets';

export interface NewClientProducts {
  kiosks: boolean;
  digitalDisplays: boolean;
  mobilePwa: boolean;
  videoWalls: boolean;
  tablets: boolean;
}

const PRODUCT_OPTIONS: ReadonlyArray<{
  id: ProductId;
  label: string;
  sub: string;
  Icon: typeof Monitor;
}> = [
  { id: 'kiosks', label: 'Kiosk', sub: 'Portrait + landscape', Icon: Monitor },
  { id: 'mobilePwa', label: 'Mobile PWA', sub: 'Phone web app', Icon: Smartphone },
  { id: 'digitalDisplays', label: 'Display', sub: 'Signage 1920×1080', Icon: Tv },
  { id: 'videoWalls', label: 'Video Wall', sub: 'Multi-TV grids', Icon: LayoutGrid },
  { id: 'tablets', label: 'Tablet', sub: 'In-room tablet', Icon: Tablet },
];

function allProductsOn(): NewClientProducts {
  return {
    kiosks: true,
    digitalDisplays: true,
    mobilePwa: true,
    videoWalls: true,
    tablets: true,
  };
}

export function NewClientModal({
  open,
  existingSlugs,
  onClose,
  onCreate,
}: {
  open: boolean;
  existingSlugs: string[];
  onClose: () => void;
  onCreate: (input: {
    slug: string;
    nombre: string;
    website: string;
    location: string;
    emptyMode: boolean;
    /** Starter por vertical (F-HUB-1); '' = template default. */
    starterId: string;
    products: NewClientProducts;
  }) => Promise<void>;
}) {
  const [nombre, setNombre] = useState('');
  const [slug, setSlug] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  // Flag explícito: el slug solo deja de auto-seguir al nombre cuando el
  // usuario lo edita a mano.
  const [slugTouched, setSlugTouched] = useState(false);
  const [products, setProducts] = useState<NewClientProducts>(allProductsOn);
  // Empty mode: arranca el kiosk sin mock data (listings/events/passes/deals/
  // trails/itinerary local_listings/social-wall posts).
  const [emptyMode, setEmptyMode] = useState(false);
  // Starter por vertical (F-HUB-1): '' = template default (sin override).
  const [starterId, setStarterId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nombreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setNombre('');
    setSlug('');
    setWebsite('');
    setLocation('');
    setSlugTouched(false);
    setProducts(allProductsOn());
    setEmptyMode(false);
    setStarterId('');
    setError(null);
    setSubmitting(false);
    setTimeout(() => nombreRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (slugTouched) return;
    setSlug(slugify(nombre));
  }, [nombre, slugTouched]);

  useEscapeClose(open, onClose);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(open, dialogRef);

  const toggleProduct = (id: ProductId) => {
    setProducts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const validateSlug = (): string | null => {
    if (!slug) return 'Slug is required';
    if (!SLUG_REGEX.test(slug)) {
      return 'Slug must be lowercase letters, digits and hyphens (1–64 chars).';
    }
    if (existingSlugs.includes(slug)) {
      return `A client with slug "${slug}" already exists`;
    }
    return null;
  };

  const hasAnyProduct = Object.values(products).some(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nombre.trim()) {
      setError('Name is required');
      return;
    }
    const slugError = validateSlug();
    if (slugError) {
      setError(slugError);
      return;
    }
    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      setError('Location is required');
      return;
    }
    if (!LOCATION_REGEX.test(trimmedLocation)) {
      setError('Location must be a city, e.g. "Davenport, FL" or "Paris, France"');
      return;
    }
    const trimmedWebsite = website.trim();
    if (trimmedWebsite && !/^https?:\/\//i.test(trimmedWebsite)) {
      setError('Website must start with http:// or https://');
      return;
    }
    if (!hasAnyProduct) {
      setError('Select at least one product to activate for this client.');
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({
        slug,
        nombre: nombre.trim(),
        website: trimmedWebsite,
        location: trimmedLocation,
        emptyMode,
        starterId,
        products,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-md"
          />
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
            <motion.div
              key="modal"
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="new-client-title"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto w-[720px] max-w-[94vw] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5 dark:border-zinc-800">
                <h2
                  id="new-client-title"
                  className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white"
                >
                  New client
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid h-8 w-8 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
                <Field
                  id="kiosk-name"
                  label="Name"
                  hint="Display name shown on the kiosk and in the studio list."
                  input={
                    <input
                      ref={nombreRef}
                      id="kiosk-name"
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="e.g. Phoenix Convention Center"
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
                      autoComplete="off"
                    />
                  }
                />

                <Field
                  id="kiosk-slug"
                  label="Slug"
                  hint="Used in URLs and in the file system: clients/<slug>/. Auto-generated from name."
                  input={
                    <input
                      id="kiosk-slug"
                      type="text"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value.toLowerCase());
                        setSlugTouched(true);
                      }}
                      placeholder="phoenix-convention-center"
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 font-mono text-[13px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
                      autoComplete="off"
                      spellCheck={false}
                    />
                  }
                />

                <div className="grid grid-cols-2 gap-3">
                  <Field
                    id="kiosk-website"
                    label="Website"
                    hint="Used in footer + share modals."
                    input={
                      <input
                        id="kiosk-website"
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://visitcentralflorida.org"
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
                        autoComplete="off"
                        spellCheck={false}
                      />
                    }
                  />
                  <Field
                    id="kiosk-location"
                    label="Location"
                    hint="City + state. Used as default address for mock listings and to center the map module."
                    input={
                      <input
                        id="kiosk-location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Davenport, FL"
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-[13px] text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-600"
                        autoComplete="off"
                      />
                    }
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
                      Products
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-500">
                      All selected by default — uncheck the ones you don&apos;t need.
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {PRODUCT_OPTIONS.map((opt) => (
                      <ProductOption
                        key={opt.id}
                        active={products[opt.id]}
                        onClick={() => toggleProduct(opt.id)}
                        label={opt.label}
                        sub={opt.sub}
                        Icon={opt.Icon}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">
                    Every selected product is created automatically when the client is saved.
                    Branding, content and modules are cloned from the TrueOmni template — you can
                    customize anything in the editor afterwards.
                  </p>
                </div>

                {/* Starter por vertical (F-HUB-1): aplica paleta + fonts + módulos
                    + preguntas del Ask AI. Opcional — sin selección = template default. */}
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">
                      Starter template
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-500">
                      Optional — sets a vertical&apos;s palette, fonts &amp; modules.
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {STARTERS.map((s) => {
                      const pal = findPalette(s.paletteId);
                      const active = starterId === s.id;
                      return (
                        <button
                          type="button"
                          key={s.id}
                          onClick={() => setStarterId(active ? '' : s.id)}
                          aria-pressed={active}
                          className={`flex flex-col items-start rounded-md border px-3 py-2.5 text-left transition ${
                            active
                              ? 'border-sky-500 bg-sky-50 ring-1 ring-sky-500/30 dark:border-sky-400 dark:bg-sky-500/10'
                              : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:border-zinc-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="flex gap-0.5" aria-hidden>
                              <span
                                className="h-4 w-4 rounded-sm"
                                style={{ background: pal?.primary }}
                              />
                              <span
                                className="h-4 w-4 rounded-sm"
                                style={{ background: pal?.secondary }}
                              />
                              <span
                                className="h-4 w-4 rounded-sm"
                                style={{ background: pal?.tertiary }}
                              />
                            </span>
                            <span className="text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
                              {s.label}
                            </span>
                          </span>
                          <span className="mt-1 line-clamp-2 text-[10.5px] leading-snug text-zinc-500 dark:text-zinc-500">
                            {s.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <p
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
                  >
                    {error}
                  </p>
                )}

                {/* Empty mode toggle: arranca sin mock data (listings/events/etc.) */}
                <div className="flex items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-[12px] leading-relaxed text-zinc-700 transition hover:border-zinc-300 hover:bg-white dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900">
                  <input
                    id="kiosk-empty-mode"
                    type="checkbox"
                    checked={emptyMode}
                    onChange={(e) => setEmptyMode(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-sky-600 focus:ring-sky-500/40 dark:border-zinc-600"
                  />
                  <label
                    htmlFor="kiosk-empty-mode"
                    className="flex cursor-pointer flex-col gap-0.5"
                  >
                    <span className="font-medium text-zinc-800 dark:text-zinc-200">
                      Start empty (no demo content)
                    </span>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-500">
                      Skip the listings, events, passes, deals, trails, social-wall posts and Trip
                      Planner local listings from the TrueOmni template. Branding and module
                      structure are still inherited.
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-[12.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !nombre.trim() || !slug || !hasAnyProduct}
                    className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-1.5 text-[12.5px] font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
                  >
                    {submitting ? 'Creating…' : 'Create client'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function ProductOption({
  active,
  onClick,
  label,
  sub,
  Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  sub: string;
  Icon: typeof Monitor;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="checkbox"
      aria-checked={active}
      className={`relative flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition ${
        active
          ? 'border-sky-500 bg-sky-50 text-sky-900 dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-100'
          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:bg-zinc-900'
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-md ${
          active
            ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
            : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400'
        }`}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" strokeWidth={1.7} />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="whitespace-nowrap text-[13px] font-semibold leading-tight">{label}</span>
        <span className="whitespace-nowrap text-[11px] opacity-70">{sub}</span>
      </span>
      <span
        aria-hidden
        className={`pointer-events-none absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-[4px] border text-[10px] ${
          active
            ? 'border-sky-500 bg-sky-500 text-white'
            : 'border-zinc-300 bg-white text-transparent dark:border-zinc-600 dark:bg-zinc-900'
        }`}
      >
        ✓
      </span>
    </button>
  );
}

function Field({
  id,
  label,
  hint,
  input,
}: {
  id: string;
  label: string;
  hint?: string;
  input: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-[12px] font-medium text-zinc-800 dark:text-zinc-200"
      >
        {label}
      </label>
      {input}
      {hint && (
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-500">{hint}</p>
      )}
    </div>
  );
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}
