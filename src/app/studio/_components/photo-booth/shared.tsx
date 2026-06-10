'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { GripVertical, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import type { PhotoBoothConfig } from '@/lib/studio/schema';

import { resolveStudioAsset } from '../../_lib/asset-resolve';
import { useStudioSlug } from '../../_lib/slug-context';

/* ────────────────────────────────────────────────────────────────────────── */
/* PhotoBooth — helpers presentacionales compartidos (F-QA-1).                 */
/* ────────────────────────────────────────────────────────────────────────── */

export interface IdItem {
  id: string;
}

export function ListReorderItem<T extends IdItem>({
  item,
  preview,
  previewKind,
  label,
  onRemove,
  renderEditor,
}: {
  item: T;
  preview?: string;
  previewKind: 'image' | 'filter';
  label: string;
  onRemove?: () => void;
  renderEditor: () => ReactNode;
}) {
  const dragControls = useDragControls();
  const [expanded, setExpanded] = useState(false);
  const slug = useStudioSlug();
  const resolvedPreview =
    previewKind === 'image' && preview && slug ? resolveStudioAsset(slug, preview) : preview;

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={dragControls}
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-900 dark:bg-zinc-900/40"
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-400 transition hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={`Drag ${label}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="grid h-10 w-10 shrink-0 overflow-hidden rounded-md bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800">
          {previewKind === 'image' && resolvedPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolvedPreview} alt="" className="h-full w-full object-cover" />
          ) : previewKind === 'filter' ? (
            <span
              className="grid h-full w-full place-items-center bg-gradient-to-br from-zinc-300 to-zinc-500 text-[9px] font-bold text-white"
              style={{ filter: preview === 'none' ? undefined : preview }}
            >
              Aa
            </span>
          ) : (
            <div className="grid h-full w-full place-items-center text-zinc-400">
              <ImageIcon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <div className="truncate font-display text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
            {label || <em className="text-zinc-400">No label</em>}
          </div>
          <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-600">
            id · {item.id}
          </div>
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
            aria-label="Remove"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {expanded && (
        <div className="space-y-3 border-t border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-900 dark:bg-zinc-900/30">
          {renderEditor()}
        </div>
      )}
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2.5 text-[12px] font-medium text-zinc-600 transition hover:border-sky-500/40 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/**
 * Preview chroma key (audit F-12, rediseñado con skill `frontend-design`).
 *
 * Diseño del componente:
 *   - Frame 9:16 simulando la pantalla del kiosk (portrait, rounded, ring).
 *   - Background: primer bg con imagen real del catálogo. Si el catálogo
 *     está vacío o solo tiene el placeholder "Original" (image=''), usamos
 *     un gradient ambient (azul → violeta → ámbar) que evoca un atardecer
 *     genérico, NO un broken-image icon.
 *   - Subject: silueta-aura con `radialGradient` (cabeza + hombros).
 *     Cambia su tamaño con `cameraZoom` y se suaviza con `edgeFeather`.
 *   - Bottom vignette + light beam top: dan profundidad y comunican
 *     "esta es una composite real" sin caer en el uncanny valley.
 *   - Pills informativos arriba: feather, zoom, bg label — datos en vivo.
 *
 * El zoom solo afecta a la silueta (no al frame). El frame del kiosk
 * SIEMPRE renderiza al mismo tamaño visual.
 */
export function ChromaPreview({ photoBooth }: { photoBooth: PhotoBoothConfig }) {
  const slug = useStudioSlug();
  const feather = photoBooth.edgeFeather ?? 3;
  const zoom = photoBooth.cameraZoom ?? 1;

  // Buscamos el primer background con imagen REAL (no '' del placeholder
  // "Original"). Si todos están vacíos, dejamos `bgUrl=null` y dibujamos el
  // gradient ambient.
  const firstBgWithImage = photoBooth.backgrounds.find(
    (bg) => typeof bg.image === 'string' && bg.image.length > 0,
  );
  const bgUrl = firstBgWithImage && slug ? resolveStudioAsset(firstBgWithImage.image, slug) : null;
  const bgLabel = firstBgWithImage?.label ?? 'Ambient';

  // Si la imagen no carga en runtime, caemos al gradient ambient para no
  // mostrar un rectángulo negro feo. `useState` para reactivar el fallback.
  const [bgFailed, setBgFailed] = useState(false);
  const showAmbient = !bgUrl || bgFailed;

  // El blur simula el feather. ×0.7 da rango perceptible pero no destruye
  // la silueta a max (10px → 7px de blur efectivo).
  const blurPx = feather * 0.7;
  // El zoom solo escala la silueta. Clamp a 0.4–1.6 para que la preview
  // siga siendo legible aún en extremos del slider real (0.5–2).
  const previewScale = Math.min(1.6, Math.max(0.4, zoom));

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950">
      {/* Header strip: live indicator + label */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 bg-white/40 px-3.5 py-2 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/40">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-zinc-700 dark:text-zinc-300">
            Live preview
          </span>
        </div>
        <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-500">
          MediaPipe · 1080×1920
        </span>
      </div>

      {/* Frame */}
      <div className="px-5 py-5">
        <div className="relative mx-auto aspect-[9/16] w-44 overflow-hidden rounded-xl shadow-[0_20px_50px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/5">
          {/* Background layer */}
          {bgUrl && !bgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bgUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
              onError={() => setBgFailed(true)}
            />
          ) : null}
          {showAmbient && (
            <>
              {/* Paleta monocromática elegante — graphite → slate → smoke.
                  Un solo hue (zinc/slate) con micro-shifts a cool blue para
                  dar profundidad sin caer en rainbow. */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(ellipse 140% 90% at 50% 0%, rgba(82, 89, 102, 0.55) 0%, transparent 60%), radial-gradient(ellipse 120% 80% at 70% 100%, rgba(30, 35, 45, 0.7) 0%, transparent 65%), linear-gradient(170deg, #1a1d24 0%, #0f1116 60%, #06080c 100%)',
                }}
              />
              {/* Top light wash — luz frontal sutil de cabina de fotografía */}
              <div
                className="absolute inset-0 opacity-50"
                style={{
                  background:
                    'radial-gradient(ellipse 70% 35% at 50% 20%, rgba(226, 232, 240, 0.18) 0%, transparent 70%)',
                }}
              />
              {/* Vertical column rim — cool rim light en el borde derecho */}
              <div
                className="absolute inset-y-0 right-0 w-1/3 opacity-30"
                style={{
                  background:
                    'linear-gradient(270deg, rgba(148, 163, 184, 0.25) 0%, transparent 100%)',
                }}
              />
              {/* Grain — film noise sutil que da textura sin distraer */}
              <div
                className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
                style={{
                  backgroundImage:
                    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.95' numOctaves='2'/></filter><rect width='120' height='120' filter='url(%23n)' opacity='1'/></svg>\")",
                }}
              />
            </>
          )}

          {/* Top light wash — da profundidad y simula iluminación frontal */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1/3"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)',
            }}
          />

          {/* Subject (aura) — escala con zoom, blur con feather. */}
          <div
            className="absolute inset-0 grid place-items-end overflow-hidden"
            style={{
              filter: `blur(${blurPx}px)`,
              transform: `scale(${previewScale})`,
              transformOrigin: 'center 78%',
            }}
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 120 200"
              preserveAspectRatio="xMidYMax meet"
              className="h-[92%] w-full"
            >
              <defs>
                {/* Aura monocromática: blanco luminoso → fade. Sin tintes de color
                    para que el preview se sienta cromático y elegante. */}
                <radialGradient id="chroma-aura-head-v4" cx="0.5" cy="0.45" r="0.55">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.45)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                <radialGradient id="chroma-aura-body-v4" cx="0.5" cy="0.4" r="0.6">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
                  <stop offset="55%" stopColor="rgba(255,255,255,0.28)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                {/* Halo glow detrás de la cabeza — wash más amplio */}
                <radialGradient id="chroma-halo-v4" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.32)" />
                  <stop offset="65%" stopColor="rgba(255,255,255,0.08)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
              </defs>
              {/* Halo glow detrás del sujeto */}
              <ellipse cx="60" cy="65" rx="42" ry="46" fill="url(#chroma-halo-v4)" />
              {/* Cuerpo: torso con hombros */}
              <ellipse cx="60" cy="170" rx="55" ry="60" fill="url(#chroma-aura-body-v4)" />
              {/* Cabeza */}
              <ellipse cx="60" cy="62" rx="20" ry="24" fill="url(#chroma-aura-head-v4)" />
            </svg>
          </div>

          {/* Bottom vignette para anclar la composición */}
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4"
            style={{
              background: 'linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)',
            }}
          />

          {/* Rule-of-thirds guides — bien sutiles, solo se ven al detenerse */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
            aria-hidden="true"
          >
            <line
              x1="33.33%"
              y1="0"
              x2="33.33%"
              y2="100%"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.5"
              strokeDasharray="2 4"
            />
            <line
              x1="66.66%"
              y1="0"
              x2="66.66%"
              y2="100%"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.5"
              strokeDasharray="2 4"
            />
            <line
              x1="0"
              y1="33.33%"
              x2="100%"
              y2="33.33%"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.5"
              strokeDasharray="2 4"
            />
            <line
              x1="0"
              y1="66.66%"
              x2="100%"
              y2="66.66%"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.5"
              strokeDasharray="2 4"
            />
          </svg>

          {/* Pills overlay arriba — paleta neutral elegante (zinc + glass). */}
          <div className="absolute left-2 right-2 top-2 flex flex-wrap items-center justify-between gap-1">
            <span className="rounded-full border border-white/15 bg-zinc-900/55 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/85 backdrop-blur-md">
              {bgLabel}
            </span>
            <div className="flex items-center gap-1">
              <span className="rounded-full border border-white/15 bg-zinc-900/55 px-2 py-0.5 font-mono text-[9px] tracking-wider text-white/85 backdrop-blur-md">
                {feather}px
              </span>
              <span className="rounded-full border border-white/15 bg-zinc-900/55 px-2 py-0.5 font-mono text-[9px] tracking-wider text-white/85 backdrop-blur-md">
                {zoom.toFixed(2)}×
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      <div className="border-t border-zinc-200/80 bg-white/40 px-3.5 py-2.5 backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-950/40">
        <p className="text-[11px] leading-relaxed text-zinc-600 dark:text-zinc-400">
          The live kiosk runs MediaPipe SelfieSegmentation on the camera feed —{' '}
          <strong className="font-semibold text-zinc-800 dark:text-zinc-200">feather</strong>{' '}
          softens the mask edges,{' '}
          <strong className="font-semibold text-zinc-800 dark:text-zinc-200">zoom</strong> changes
          how much of the visitor fits in the frame.
        </p>
      </div>
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 p-4 text-center text-[12px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/20">
      {text}
    </div>
  );
}

export const inputCls =
  'w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12.5px] text-zinc-800 outline-none transition focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100';

export function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <header className="mb-3">
        <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
        {hint && <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">{hint}</p>}
      </header>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-left transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <span className="text-[12px] text-zinc-700 dark:text-zinc-300">{label}</span>
      <span
        className={
          'relative flex h-5 w-9 shrink-0 items-center rounded-full transition ' +
          (enabled ? 'bg-sky-500/90' : 'bg-zinc-200 dark:bg-zinc-800')
        }
      >
        <span
          className={
            'h-4 w-4 transform rounded-full bg-white shadow-sm transition ' +
            (enabled ? 'translate-x-[18px]' : 'translate-x-0.5')
          }
        />
      </span>
    </button>
  );
}
