'use client';

import { Maximize, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { useEffect, useRef, useState, type RefObject } from 'react';

type PreviewOrientation = 'portrait' | 'landscape' | 'mobile-pwa';

const ORIENTATION_DIMS: Record<PreviewOrientation, { w: number; h: number }> = {
  portrait: { w: 1080, h: 1920 },
  landscape: { w: 1920, h: 1080 },
  'mobile-pwa': { w: 390, h: 844 },
};

/**
 * Live Preview Panel.
 *
 * Carga el kiosk runtime en un iframe escalado al área disponible.
 * El bridge `usePreviewBridge()` (vivido en el Shell) envía postMessage
 * al iframe en cada cambio del editor. Aquí solo asignamos la `iframeRef`
 * y notificamos `onLoad` para que el bridge pueda re-handshake al
 * cambiar de orientación / reload.
 */
/** Locales soportados por todos los kiosks. Si el cliente activo no tiene
 *  uno cargado en el bundle, el i18n-provider runtime lo ignora silenciosa-
 *  mente (guard `available.includes(next)`). */
const PREVIEW_LOCALES = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
  { value: 'fr', label: 'FR' },
  { value: 'de', label: 'DE' },
  { value: 'pt', label: 'PT' },
  { value: 'ja', label: 'JA' },
] as const;

export function PreviewPanel({
  slug,
  nombre,
  initialOrientation = 'portrait',
  reloadKey,
  iframeRef,
  onIframeLoad,
  onLocaleChange,
}: {
  slug: string;
  nombre: string;
  initialOrientation?: PreviewOrientation;
  reloadKey: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onIframeLoad?: () => void;
  /** Callback al cambiar el locale del preview iframe (#10 audit). El Studio
   *  empuja el locale al kiosk via postMessage; el i18n-provider lo aplica
   *  sin reload. */
  onLocaleChange?: (locale: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const [orientation, setOrientation] = useState<PreviewOrientation>(initialOrientation);
  const [fullScreen, setFullScreen] = useState(false);
  const [locale, setLocale] = useState<string>('en');

  const { w, h } = ORIENTATION_DIMS[orientation];

  // Default 40% pero auto-fit hacia abajo si el panel es muy estrecho (lg @1024
  // tiene ~384px de ancho útil → 1080*0.4=432 se cortaría 48px).
  // El usuario sigue pudiendo zoomear con +/- libremente. El ResizeObserver
  // solo BAJA el scale si overflowearía; si el panel se ensancha, dejamos el
  // scale como está (no auto-subimos para no pelear con el usuario).
  //
  // Audit F-38: al cambiar orientation (portrait↔landscape), recomputamos un
  // scale base apropiado al nuevo ratio en lugar de hard-set 0.4 — landscape
  // 1920px casi nunca cabe a 0.4 (= 768px) en lg.
  //
  // Mobile PWA: default 80% — el viewport es 390×844, mucho más pequeño que
  // el portrait, así que cabe holgado y un zoom mayor hace que el placeholder
  // y futuros previews mobile sean legibles sin tener que tocar el zoom.
  useEffect(() => {
    const defaultScale = orientation === 'mobile-pwa' ? 0.8 : 0.4;
    const holder = containerRef.current?.parentElement;
    if (!holder) {
      setScale(defaultScale);
      return;
    }
    const padding = 24;
    const availW = holder.clientWidth - padding * 2;
    const availH = holder.clientHeight - padding * 2;
    const fit = Math.min(availW / w, availH / h);
    setScale(Math.min(defaultScale, Math.max(0.15, fit)));
  }, [orientation, w, h]);

  useEffect(() => {
    const holder = containerRef.current?.parentElement;
    if (!holder) return;
    const padding = 24; // p-6 alrededor del holder
    const computeMaxFit = () => {
      const availW = holder.clientWidth - padding * 2;
      const availH = holder.clientHeight - padding * 2;
      if (availW <= 0 || availH <= 0) return null;
      return Math.min(availW / w, availH / h);
    };
    const apply = () => {
      const max = computeMaxFit();
      if (max === null) return;
      setScale((current) => (current > max ? Math.max(0.15, max) : current));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(holder);
    return () => ro.disconnect();
  }, [w, h]);
  // Apuntamos a la raíz del kiosk (`/`), que es el Billboard idle / splash —
  // la primera pantalla que ve el usuario antes de tocar y entrar a /home.
  // Fase S0 lo cambiará por `/preview/${client.slug}`.
  // Pasa el viewport como query param para que el KioskCanvas client-side
  // pueda detectar mobile-pwa y renderizar a 390×844 en lugar de 1080×1920.
  const previewSrc = orientation === 'mobile-pwa' ? '/?viewport=mobile-pwa' : '/';

  return (
    <div className="flex h-full w-full flex-col">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between px-6 pb-3 pt-4">
        <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-0.5 dark:border-zinc-900 dark:bg-zinc-950">
          <DeviceTab
            active={orientation === 'portrait'}
            onClick={() => setOrientation('portrait')}
            icon={<KioskGlyph />}
            label="Kiosk · 1080×1920"
          />
          <DeviceTab
            active={orientation === 'landscape'}
            onClick={() => setOrientation('landscape')}
            icon={<LandscapeGlyph />}
            label="Landscape · 1920×1080"
          />
          <DeviceTab
            active={orientation === 'mobile-pwa'}
            onClick={() => setOrientation('mobile-pwa')}
            icon={<MobilePwaGlyph />}
            label="PWA · 390×844"
          />
        </div>

        <div className="flex items-center gap-1 text-[11px] text-zinc-500">
          {/* Locale picker — empuja al iframe via postMessage sin reload (#10). */}
          {onLocaleChange ? (
            <select
              value={locale}
              onChange={(e) => {
                const next = e.target.value;
                setLocale(next);
                onLocaleChange(next);
              }}
              aria-label="Preview locale"
              title="Preview locale (changes the kiosk language without reload)"
              className="mr-2 rounded-md border border-zinc-200 bg-white px-1.5 py-0.5 font-mono text-[11px] text-zinc-700 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            >
              {PREVIEW_LOCALES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          ) : null}
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Zoom out 10%"
            disabled={scale <= 0.15}
            onClick={() => setScale((s) => Math.max(0.15, Math.round((s - 0.1) * 100) / 100))}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="min-w-[44px] rounded border border-zinc-200 bg-white px-2 py-0.5 text-center font-mono dark:border-zinc-900 dark:bg-zinc-950">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Zoom in 10%"
            disabled={scale >= 1}
            onClick={() => setScale((s) => Math.min(1, Math.round((s + 0.1) * 100) / 100))}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="ml-1 grid h-7 w-7 place-items-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            aria-label="Reset zoom (auto-fit)"
            onClick={() => {
              const el = containerRef.current?.parentElement;
              if (!el) return setScale(0.4);
              const padding = 56;
              const availH = el.clientHeight - padding * 2;
              const availW = el.clientWidth - padding * 2;
              const wantedW = ORIENTATION_DIMS[orientation].w;
              const wantedH = ORIENTATION_DIMS[orientation].h;
              const next = Math.min(availH / wantedH, availW / wantedW);
              setScale(Math.min(Math.max(next, 0.4), 0.65));
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
            aria-label="Open kiosk in full screen"
            onClick={() => setFullScreen(true)}
          >
            <Maximize className="h-3.5 w-3.5" />
            Full screen
          </button>
        </div>
      </div>

      {/* Frame holder: ÚNICAMENTE el iframe escalado, sin chrome (no border, no
          rounded, no shadow, no bg propio). El kiosk de /home renderiza ya con
          su propio fondo, así que cualquier wrapper extra mete artefactos. */}
      <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          style={{
            width: w * scale,
            height: h * scale,
          }}
        >
          {orientation === 'landscape' ? (
            <OrientationComingSoon
              slug={slug}
              scale={scale}
              width={w}
              height={h}
              orientation={orientation}
            />
          ) : (
            <iframe
              ref={iframeRef}
              key={`${slug}-${orientation}-${reloadKey}`}
              src={previewSrc}
              title={`${nombre} live preview`}
              className="absolute left-0 top-0 block border-0"
              style={{
                width: w,
                height: h,
                transform: `scale(${scale})`,
                transformOrigin: '0 0',
              }}
              loading="eager"
              onLoad={onIframeLoad}
            />
          )}
        </div>
      </div>

      {/* Footer caption */}
      <div className="flex shrink-0 items-center justify-between border-t border-zinc-200 px-6 py-2.5 text-[11px] text-zinc-500 dark:border-zinc-900 dark:text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
          Live preview · debounced 120 ms · postMessage bridge
        </span>
        <span className="font-mono">/preview/{slug}</span>
      </div>

      {fullScreen && (
        <FullScreenPreview
          slug={slug}
          nombre={nombre}
          orientation={orientation}
          onClose={() => setFullScreen(false)}
        />
      )}
    </div>
  );
}

/**
 * Overlay full-window que muestra el kiosk a tamaño real (1080×1920 portrait
 * o 1920×1080 landscape), escalado para fit-to-viewport. Mantiene el theme
 * light/dark del Studio (lee la clase `dark` del root) y muestra un CTA
 * "Back to editor" en la esquina superior izquierda.
 *
 * Para landscape sigue mostrando el placeholder Coming Soon — la idea es
 * que esto refleje exactamente lo que el usuario ve hoy en /, no que actúe
 * como una vista distinta.
 */
function FullScreenPreview({
  slug,
  nombre,
  orientation,
  onClose,
}: {
  slug: string;
  nombre: string;
  orientation: PreviewOrientation;
  onClose: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const { w, h } = ORIENTATION_DIMS[orientation];

  useEffect(() => {
    function fit() {
      const padding = 80;
      const availH = window.innerHeight - padding * 2;
      const availW = window.innerWidth - padding * 2;
      setScale(Math.min(availH / h, availW / w, 1));
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [w, h]);

  // ESC para cerrar.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Full screen preview of ${nombre}`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-100 dark:bg-zinc-950"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute left-6 top-6 z-10 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-[13px] font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <span aria-hidden="true">←</span>
        Back to editor
      </button>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close full screen"
        className="absolute right-6 top-6 z-10 grid h-9 w-9 place-items-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <X className="h-4 w-4" />
      </button>

      <div
        ref={wrapRef}
        className="relative overflow-hidden shadow-2xl"
        style={{ width: w * scale, height: h * scale }}
      >
        {orientation === 'landscape' || orientation === 'mobile-pwa' ? (
          <OrientationComingSoon
            slug={slug}
            scale={scale}
            width={w}
            height={h}
            orientation={orientation}
          />
        ) : (
          <iframe
            src="/"
            title={`${nombre} full screen`}
            className="absolute left-0 top-0 block border-0"
            style={{
              width: w,
              height: h,
              transform: `scale(${scale})`,
              transformOrigin: '0 0',
            }}
            loading="eager"
          />
        )}
      </div>

      <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[11.5px] text-zinc-500 dark:text-zinc-500">
        {nombre} · {w}×{h} · {Math.round(scale * 100)}% · ESC to close
      </span>
    </div>
  );
}

function DeviceTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] transition ${
        active
          ? 'bg-zinc-100 text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
          : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/**
 * Placeholder full-bleed que reemplaza al iframe del kiosk cuando el
 * usuario activa una pestaña aún no implementada (Landscape 1920×1080
 * o Mobile PWA 390×844). Estética premium matching el branding del
 * Studio (gradient + grid + spotlight). El contenido real para esas
 * orientaciones entra en una fase posterior — el publish backend ya
 * acepta los 3 valores en el schema.
 */
function OrientationComingSoon({
  slug,
  scale,
  width,
  height,
  orientation,
}: {
  slug: string;
  scale: number;
  width: number;
  height: number;
  orientation: 'landscape' | 'mobile-pwa';
}) {
  const meta =
    orientation === 'landscape'
      ? {
          modeLabel: 'Landscape mode',
          headline: 'Coming soon.',
          body: (
            <>
              A 1920×1080 horizontal kiosk experience for{' '}
              <span className="font-semibold text-white">TrueOmni</span> is in design.
              Switch back to <span className="text-sky-300">Kiosk · 1080×1920</span> to
              keep editing the portrait experience.
            </>
          ),
          dimsLabel: '1920 × 1080',
          ratio: '16:9',
        }
      : {
          modeLabel: 'Mobile PWA',
          headline: 'Coming soon.',
          body: (
            <>
              A 390×844 mobile PWA experience for{' '}
              <span className="font-semibold text-white">TrueOmni</span> is in design.
              Switch back to <span className="text-sky-300">Kiosk · 1080×1920</span> to
              keep editing the portrait experience. The PWA bundle is still generated
              at publish time alongside the kiosk.
            </>
          ),
          dimsLabel: '390 × 844',
          ratio: '9:19.5',
        };
  return (
    <div
      className="absolute left-0 top-0 overflow-hidden"
      style={{
        width,
        height,
        transform: `scale(${scale})`,
        transformOrigin: '0 0',
        background:
          'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(210 70% 25%) 0%, hsl(220 50% 8%) 60%, hsl(220 30% 4%) 100%)',
        color: '#fff',
      }}
    >
      {/* Grid pattern */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '120px 120px',
          maskImage:
            'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(0,0,0,1), transparent 90%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(0,0,0,1), transparent 90%)',
        }}
      />
      {/* Spotlight */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle 600px at 50% 30%, rgba(125, 211, 252, 0.25), transparent 70%)',
        }}
      />
      {/* Content */}
      <div className="relative flex h-full w-full flex-col items-center justify-center px-32 text-center">
        <span
          className="mb-12 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-7 py-3 backdrop-blur"
          style={{ fontSize: 28, letterSpacing: '0.18em' }}
        >
          <span className="block h-2.5 w-2.5 animate-pulse rounded-full bg-sky-400" />
          <span className="font-mono uppercase">{meta.modeLabel}</span>
        </span>
        <h1
          className="font-display font-bold tracking-tight"
          style={{
            fontSize: orientation === 'mobile-pwa' ? 80 : 220,
            lineHeight: 0.92,
            background: 'linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.45) 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            color: 'transparent',
          }}
        >
          {meta.headline}
        </h1>
        <p
          className="mt-12 max-w-[1400px] leading-snug text-white/75"
          style={{ fontSize: orientation === 'mobile-pwa' ? 18 : 36, lineHeight: 1.4 }}
        >
          {meta.body}
        </p>
        <div
          className="mt-16 flex items-center gap-6 text-white/55"
          style={{ fontSize: orientation === 'mobile-pwa' ? 13 : 22 }}
        >
          <span className="font-mono">/clients/{slug}</span>
          <span>·</span>
          <span>{meta.dimsLabel}</span>
          <span>·</span>
          <span>{meta.ratio}</span>
        </div>
      </div>
      {/* TrueOmni mark */}
      <div
        className="absolute bottom-12 right-16 flex items-center gap-3 text-white/40"
        style={{ fontSize: 20 }}
      >
        <span className="font-mono uppercase tracking-[0.22em]">TrueOmni · Studio</span>
      </div>
    </div>
  );
}

function KioskGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="1.5" width="8" height="13" rx="1.2" />
      <line x1="6.8" y1="13" x2="9.2" y2="13" />
    </svg>
  );
}

function LandscapeGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1.5" y="4" width="13" height="8" rx="1.2" />
      <line x1="13" y1="6.8" x2="13" y2="9.2" />
    </svg>
  );
}

function MobilePwaGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="1.5" width="6" height="13" rx="1.2" />
      <line x1="7" y1="12.6" x2="9" y2="12.6" />
      <line x1="6.5" y1="3.2" x2="9.5" y2="3.2" />
    </svg>
  );
}
