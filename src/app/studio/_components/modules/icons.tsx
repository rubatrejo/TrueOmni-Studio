'use client';

import {
  Activity,
  Anchor,
  BedDouble,
  Beer,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Bus,
  Calendar,
  Camera,
  Car,
  Church,
  ClipboardList,
  Coffee,
  Compass,
  Croissant,
  Drama,
  Dumbbell,
  Film,
  Footprints,
  Flower2,
  Fuel,
  GraduationCap,
  Hammer,
  Heart,
  Hotel,
  IceCream,
  Landmark,
  Leaf,
  ListChecks,
  Map,
  MapPin,
  Mic,
  Mountain,
  Music,
  Palette,
  ParkingCircle,
  PenSquare,
  Phone,
  Pill,
  Pizza,
  Plane,
  Sailboat,
  Scissors,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Stethoscope,
  Store,
  Sun,
  Tag,
  Tent,
  Theater,
  Ticket,
  TicketCheck,
  Train,
  TreePine,
  Trophy,
  Upload,
  Utensils,
  UtensilsCrossed,
  Waves,
  Wine,
  Wifi,
  type LucideIcon,
} from 'lucide-react';
import { useRef } from 'react';

/* ────────────────────────────────────────────────────────────────────────── */
/* Icon helpers (Lucide + custom image) — F-QA-1: extraído de ModulesEditor   */
/* ────────────────────────────────────────────────────────────────────────── */

/** Renderiza un icono — Lucide si `iconKey` mapea, custom img si `customIcon`
 *  poblado, fallback Sparkles si ninguno. `customIcon` PREVALECE sobre iconKey. */
export function IconNode({
  iconKey,
  customIcon,
  className = 'h-4 w-4',
}: {
  iconKey?: string;
  customIcon?: string;
  className?: string;
}) {
  if (customIcon) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- asset dinámico del cliente; next/image no aplica (src arbitrario en runtime)
      <img
        loading="lazy"
        src={customIcon}
        alt=""
        className={`${className} object-contain`}
        draggable={false}
      />
    );
  }
  const LucideComp: LucideIcon =
    iconKey && LISTING_ICONS[iconKey] ? LISTING_ICONS[iconKey] : Sparkles;
  return <LucideComp className={className} />;
}

/** Icon picker shared — grid de Lucide + botón "Upload" → data URL.
 *  Cuando se sube imagen, llama `onCustomChange(dataUrl)` y limpia iconKey. */
export function IconPickerGrid({
  selectedKey,
  customIcon,
  onPick,
  onCustomChange,
}: {
  selectedKey?: string;
  customIcon?: string;
  onPick: (key: string) => void;
  onCustomChange: (dataUrl: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleUpload = (file: File) => {
    if (file.size > 200_000) {
      alert('Icon must be under 200 KB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') onCustomChange(result);
    };
    reader.readAsDataURL(file);
  };
  return (
    <div className="rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header con botón upload destacado — arriba del grid para que sea
          obvio dónde subir un icono custom (era el problema reportado por
          el operador). */}
      <div className="border-b border-zinc-200 p-2 dark:border-zinc-800">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`flex w-full items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-[11.5px] font-medium transition ${
            customIcon
              ? 'border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-300'
              : 'border-dashed border-zinc-300 bg-zinc-50 text-zinc-700 hover:border-sky-500/50 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-700 dark:bg-zinc-900/40 dark:text-zinc-300 dark:hover:text-sky-300'
          }`}
        >
          {customIcon ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img loading="lazy" src={customIcon} alt="" className="h-4 w-4 object-contain" />
              Custom icon active
            </>
          ) : (
            <>
              <Upload className="h-3.5 w-3.5" />
              Upload your icon (SVG / PNG)
            </>
          )}
        </button>
        {customIcon ? (
          <button
            type="button"
            onClick={() => onCustomChange('')}
            className="mt-1.5 w-full rounded border border-zinc-200 px-2 py-1 text-[10.5px] text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-800"
          >
            Remove custom · use Lucide
          </button>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/svg+xml,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = '';
          }}
        />
      </div>

      {/* Grid de Lucide */}
      <div className="grid max-h-[260px] grid-cols-7 gap-1 overflow-y-auto p-2">
        {Object.entries(LISTING_ICONS).map(([key, IconComp]) => (
          <button
            key={key}
            type="button"
            onClick={() => onPick(key)}
            title={key}
            className={`grid h-7 w-7 place-items-center rounded transition ${
              !customIcon && selectedKey === key
                ? 'bg-sky-500/15 text-sky-600 ring-1 ring-sky-500/40 dark:text-sky-300'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <IconComp className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Iconos Lucide por module key — reemplazan los emojis del primer iter.      */
/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Catálogo de iconos Lucide disponibles para listing modules + system tiles.
 * Las keys son los nombres tal cual los serializa el schema (`iconKey`).
 * Cubre las categorías más comunes en kioskos turísticos: comida/bebida,
 * alojamiento, transporte, naturaleza, cultura, salud, servicios, etc.
 */
export const LISTING_ICONS: Record<string, LucideIcon> = {
  // Categorías base (originales del template)
  UtensilsCrossed,
  MapPin,
  BedDouble,
  Sparkles,
  Compass,
  ListChecks,
  Footprints,
  Hotel,
  BookOpen,
  Tag,
  Camera,
  PenSquare,
  Share2,
  ClipboardList,
  Map,
  // Comida & bebida
  Utensils,
  Coffee,
  Beer,
  Wine,
  Pizza,
  IceCream,
  Croissant,
  // Compras & servicios
  ShoppingBag,
  ShoppingCart,
  Store,
  Scissors,
  Hammer,
  // Transporte
  Plane,
  Train,
  Bus,
  Car,
  Bike,
  Sailboat,
  Anchor,
  ParkingCircle,
  Fuel,
  // Naturaleza & outdoor
  Mountain,
  TreePine,
  Leaf,
  Flower2,
  Waves,
  Sun,
  Tent,
  // Cultura & entretenimiento
  Music,
  Mic,
  Theater,
  Drama,
  Film,
  Palette,
  Landmark,
  Church,
  Trophy,
  // Bienestar & salud
  Activity,
  Dumbbell,
  Heart,
  Stethoscope,
  Pill,
  // Servicios generales
  Briefcase,
  Building2,
  GraduationCap,
  Phone,
  Wifi,
};

export const MODULE_ICONS: Record<string, LucideIcon> = {
  restaurants: UtensilsCrossed,
  'things-to-do': MapPin,
  'itinerary-builder': ListChecks,
  events: Calendar,
  passes: TicketCheck,
  tickets: Ticket,
  guestbook: PenSquare,
  'social-wall': Share2,
  'digital-brochure': BookOpen,
  map: Map,
  stay: Hotel,
  survey: ClipboardList,
  deals: Tag,
  'photo-booth': Camera,
  trails: Footprints,
  wayfinding: Compass,
};
