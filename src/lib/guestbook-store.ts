'use client';

import { useCallback, useEffect, useSyncExternalStore } from 'react';

/**
 * Pin del Guestbook persistido en backend (Vercel KV) vía
 * `/api/guestbook/{slug}` GET+POST.
 *
 * El sessionStorage se mantiene como cache local OPTIMISTA — al abrir el
 * módulo, el hook hidrata primero desde sessionStorage (instantáneo), y
 * después dispara un GET al backend para reconciliar con los pins reales
 * (incluye los de OTROS kioskos del mismo cliente).
 *
 * Antes era sólo sessionStorage — los pins se perdían al cerrar la pestaña.
 */
export interface GuestbookUserPin {
  id: string;
  authorName: string;
  zipCode: string;
  coords: { lat: number; lng: number };
  /** ID del pin del catálogo usado. */
  pinOptionId: string;
  /** Path/URL del avatar (copiado del pinOption al momento de crear). */
  pinImage: string;
  comment?: string;
  /** ISO timestamp de cuando se creó. */
  createdAt: string;
  /** Dirección legible (usada en el modal del pin). */
  address?: string;
}

const STORAGE_KEY = 'kiosk_guestbook_user_pins';
const EMPTY: readonly GuestbookUserPin[] = Object.freeze([]);

let current: readonly GuestbookUserPin[] = EMPTY;
let hydrated = false;
let lastSlug: string | null = null;
const listeners = new Set<() => void>();

const notify = () => {
  for (const l of listeners) l();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

const getSnapshot = () => current;
const getServerSnapshot = () => EMPTY;

function readFromStorage(): readonly GuestbookUserPin[] {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(
      (p): p is GuestbookUserPin =>
        typeof p === 'object' &&
        p != null &&
        typeof (p as GuestbookUserPin).id === 'string' &&
        typeof (p as GuestbookUserPin).authorName === 'string',
    );
  } catch {
    return EMPTY;
  }
}

function writeToStorage(pins: readonly GuestbookUserPin[]) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  } catch {
    /* storage lleno/deshabilitado — ignorar */
  }
}

async function fetchFromBackend(slug: string): Promise<readonly GuestbookUserPin[]> {
  try {
    const res = await fetch(`/api/guestbook/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return EMPTY;
    const data = (await res.json()) as { pins?: GuestbookUserPin[] };
    return Array.isArray(data.pins) ? data.pins : EMPTY;
  } catch {
    return EMPTY;
  }
}

async function postToBackend(slug: string, pin: GuestbookUserPin): Promise<boolean> {
  try {
    const res = await fetch(`/api/guestbook/${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function hydrateIfNeeded(slug: string) {
  if (typeof window === 'undefined') return;
  // Si el slug cambió (preview Studio), re-hidratamos.
  if (hydrated && lastSlug === slug) return;
  hydrated = true;
  lastSlug = slug;

  // 1) Local cache primero (instantáneo, evita parpadeo).
  const fromStorage = readFromStorage();
  if (fromStorage.length > 0) {
    current = fromStorage;
    notify();
  }

  // 2) Reconcilia con el backend (incluye pins de otros kioskos del mismo
  //    slug). El backend es source of truth.
  void (async () => {
    const fromBackend = await fetchFromBackend(slug);
    if (fromBackend.length === 0 && fromStorage.length === 0) return;
    current = fromBackend;
    writeToStorage(fromBackend);
    notify();
  })();
}

export function addUserPin(pin: GuestbookUserPin, slug: string | null) {
  // Optimistic: añade local primero para UX inmediata.
  current = [...current, pin];
  writeToStorage(current);
  notify();

  // POST al backend en background. Si falla, el pin se queda sólo local.
  if (slug) {
    void postToBackend(slug, pin);
  }
}

export function clearUserPins() {
  if (current.length === 0) return;
  current = EMPTY;
  writeToStorage(EMPTY);
  notify();
  // Nota: no borra del backend. Cleanup masivo es operación admin
  // (TTL del KV o endpoint DELETE; no exponemos al runtime del kiosk).
}

/**
 * Hook para leer los pins del Guestbook con reactividad.
 *
 * @param slug — slug del kiosk activo. Pásalo desde el server (page.tsx)
 *   con `getClientSlug()`. Si es null/empty, opera en modo local-only.
 */
export function useGuestbookUserPins(slug: string | null) {
  const pins = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (slug) hydrateIfNeeded(slug);
  }, [slug]);

  const add = useCallback((p: GuestbookUserPin) => addUserPin(p, slug), [slug]);
  const clear = useCallback(() => clearUserPins(), []);

  return { pins, add, clear };
}
