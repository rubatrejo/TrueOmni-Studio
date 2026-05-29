'use client';

import { useCallback, useEffect, useState } from 'react';

import type { PwaNotification } from '@/lib/config';

const READ_KEY = 'pwa_notif_read';
const DELETED_KEY = 'pwa_notif_deleted';
const CHANGE_EVENT = 'pwa-notif-change';

/** Notificación con su estado de lectura resuelto desde los overlays locales. */
export interface ResolvedNotification extends PwaNotification {
  read: boolean;
}

function readSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(key: string, set: Set<string>) {
  try {
    window.localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* no-op */
  }
  // Notifica a otros consumidores montados (campana ↔ lista) en la misma pestaña.
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Estado client-side (mock, sin backend) de las notificaciones de la PWA.
 * El seed viene de config; los overlays read/deleted persisten en localStorage.
 * Sincroniza entre componentes vía un evento custom + el evento `storage`.
 */
export function useNotifications(seed: PwaNotification[]) {
  // `version` fuerza recomputar al cambiar el storage (en este o en otro tab).
  const [version, setVersion] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(CHANGE_EVENT, bump);
    window.addEventListener('storage', bump);
    return () => {
      window.removeEventListener(CHANGE_EVENT, bump);
      window.removeEventListener('storage', bump);
    };
  }, []);

  // Antes de montar (SSR/primer render) tratamos todo como no-leído ni borrado,
  // para que el HTML del server y el primer render del cliente coincidan.
  const read = mounted ? readSet(READ_KEY) : new Set<string>();
  const deleted = mounted ? readSet(DELETED_KEY) : new Set<string>();
  void version; // dependencia implícita del recompute

  const items: ResolvedNotification[] = seed
    .filter((n) => !deleted.has(n.id))
    .map((n) => ({ ...n, read: read.has(n.id) }));

  const unreadCount = items.filter((n) => !n.read).length;

  const markRead = useCallback((id: string) => {
    const next = readSet(READ_KEY);
    next.add(id);
    writeSet(READ_KEY, next);
  }, []);

  const markAllRead = useCallback(() => {
    const next = readSet(READ_KEY);
    seed.forEach((n) => next.add(n.id));
    writeSet(READ_KEY, next);
  }, [seed]);

  const deleteIds = useCallback((ids: string[]) => {
    const next = readSet(DELETED_KEY);
    ids.forEach((id) => next.add(id));
    writeSet(DELETED_KEY, next);
  }, []);

  return { items, unreadCount, mounted, markRead, markAllRead, deleteIds };
}
