'use client';

import { Plus, Trash2 } from 'lucide-react';

import type {
  PwaNotification,
  PwaProfileEvent,
  PwaProfileFavorite,
  ScavengerHunt,
  ScavengerTask,
  ScavengerTaskType,
  WayfindingAmenity,
  WayfindingFloor,
} from '@/lib/config';

/** ID estable corto para items nuevos (slug/id/key). Client-only. */
export function uid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.floor(Math.random() * 1e9).toString(36);
  return `${prefix}-${rand}`;
}

/** Botón "+ Añadir" alineado con el tema zinc del editor PWA. */
export function AddItemButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-300 px-3 py-1.5 text-[12px] font-medium text-zinc-600 transition hover:border-sky-400 hover:text-sky-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-sky-500 dark:hover:text-sky-400"
    >
      <Plus className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

/** Botón borrar (icono) para un item de lista. */
export function DeleteItemButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

export function makeBlankTask(type: ScavengerTaskType = 'photo'): ScavengerTask {
  return {
    slug: uid('task'),
    type,
    name: '',
    image: '',
    coords: { lat: 0, lng: 0 },
    description: '',
    ...(type === 'checkin' ? { checkinRadius: 50 } : {}),
    ...(type === 'question' ? { question: '', options: ['', ''], correctIndex: 0 } : {}),
  };
}

export function makeBlankHunt(): ScavengerHunt {
  return { slug: uid('hunt'), name: '', image: '', avatar: '', taskCount: 0, tasks: [] };
}

export function makeBlankAmenity(): WayfindingAmenity {
  return {
    slug: uid('amenity'),
    name: '',
    image: '',
    destination: { x: 50, y: 50 },
    routePoints: [],
    steps: [],
  };
}

export function makeBlankFloor(): WayfindingFloor {
  return {
    key: uid('floor'),
    label: '',
    floorPlanImage: '',
    origin: { x: 50, y: 50 },
    amenities: [],
  };
}

export function makeBlankNotification(): PwaNotification {
  // timestamp fijo epoch-0; el operador lo edita. (No usar Date.now en SSR-safe paths.)
  return {
    id: uid('notif'),
    type: 'info',
    title: '',
    body: '',
    timestamp: '1970-01-01T00:00:00.000Z',
  };
}

export function makeBlankFavorite(): PwaProfileFavorite {
  return { title: '', subcategory: '', distance: '', hours: '', image: '' };
}

export function makeBlankProfileEvent(): PwaProfileEvent {
  return { title: '', time: '', weekday: '', day: '', image: '', accent: 'brand' };
}
