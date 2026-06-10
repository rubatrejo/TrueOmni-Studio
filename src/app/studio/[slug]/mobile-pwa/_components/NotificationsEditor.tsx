'use client';

import type { PwaNotification, PwaNotificationsConfig } from '@/lib/config';

import { useToast } from '../../../_components/Toast';

import { AddItemButton, DeleteItemButton, makeBlankNotification } from './pwa-list-helpers';
import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

/**
 * Editor de la pantalla Notifications de la PWA. Edita los textos white-label de
 * la lista, el modo selección, el diálogo de borrado y el empty state. La lista
 * de notificaciones (`seed`) es data de demo y viene del setup — no se edita aquí.
 */

const EMPTY: PwaNotificationsConfig = {
  title: '',
  filterAll: '',
  filterUnread: '',
  markAllRead: '',
  delete: '',
  cancel: '',
  selectAll: '',
  deleteSelected: '',
  confirmTitle: '',
  confirmBody: '',
  confirmDelete: '',
  confirmCancel: '',
  emptyTitle: '',
  emptyBody: '',
  seed: [],
};

export function NotificationsEditor({
  value,
  onChange,
}: {
  value: PwaNotificationsConfig | undefined;
  onChange: (next: PwaNotificationsConfig) => void;
}) {
  const v: PwaNotificationsConfig = { ...EMPTY, ...value, seed: value?.seed ?? [] };
  const set = (patch: Partial<PwaNotificationsConfig>) => onChange({ ...v, ...patch });

  const { show } = useToast();
  const updateNotif = (i: number, patch: Partial<PwaNotification>) =>
    set({ seed: v.seed.map((n, idx) => (idx === i ? { ...n, ...patch } : n)) });
  const addNotif = () => set({ seed: [...v.seed, makeBlankNotification()] });
  const removeNotif = (i: number) => {
    const removed = v.seed[i];
    const prev = v.seed;
    set({ seed: v.seed.filter((_, idx) => idx !== i) });
    show(`Deleted notification "${removed?.title || removed?.id}"`, {
      variant: 'info',
      durationMs: 6000,
      action: { label: 'Undo', onClick: () => set({ seed: prev }) },
    });
  };

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Notifications"
        description="Texts of the notifications list, selection mode, delete confirmation and empty state."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="List">
          <PwaField label="Title" value={v.title} onChange={(title) => set({ title })} />
          <PwaField
            label="Filter · All"
            value={v.filterAll}
            onChange={(filterAll) => set({ filterAll })}
          />
          <PwaField
            label="Filter · Unread"
            value={v.filterUnread}
            onChange={(filterUnread) => set({ filterUnread })}
          />
          <PwaField
            label="Mark all read"
            value={v.markAllRead}
            onChange={(markAllRead) => set({ markAllRead })}
          />
        </PwaGroup>

        <PwaGroup title="Selection mode">
          <PwaField
            label="Enter selection (Delete)"
            value={v.delete}
            onChange={(d) => set({ delete: d })}
          />
          <PwaField label="Cancel" value={v.cancel} onChange={(cancel) => set({ cancel })} />
          <PwaField
            label="Select all"
            value={v.selectAll}
            onChange={(selectAll) => set({ selectAll })}
          />
          <PwaField
            label="Delete selected (supports {count})"
            value={v.deleteSelected}
            onChange={(deleteSelected) => set({ deleteSelected })}
          />
        </PwaGroup>

        <PwaGroup title="Delete confirmation">
          <PwaField
            label="Title"
            value={v.confirmTitle}
            onChange={(confirmTitle) => set({ confirmTitle })}
          />
          <PwaField
            label="Body"
            multiline
            value={v.confirmBody}
            onChange={(confirmBody) => set({ confirmBody })}
          />
          <PwaField
            label="Confirm button"
            value={v.confirmDelete}
            onChange={(confirmDelete) => set({ confirmDelete })}
          />
          <PwaField
            label="Cancel button"
            value={v.confirmCancel}
            onChange={(confirmCancel) => set({ confirmCancel })}
          />
        </PwaGroup>

        <PwaGroup title="Empty state">
          <PwaField
            label="Title"
            value={v.emptyTitle}
            onChange={(emptyTitle) => set({ emptyTitle })}
          />
          <PwaField
            label="Body"
            multiline
            value={v.emptyBody}
            onChange={(emptyBody) => set({ emptyBody })}
          />
        </PwaGroup>

        <PwaGroup title="Example notifications (demo data — real ones come from the backend)">
          {v.seed.length === 0 ? (
            <p className="text-[12px] text-zinc-400 dark:text-zinc-500">
              No example notifications.
            </p>
          ) : (
            v.seed.map((n, i) => (
              <div
                key={n.id}
                className="flex items-start gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Notification type"
                      value={n.type}
                      onChange={(e) =>
                        updateNotif(i, { type: e.target.value as PwaNotification['type'] })
                      }
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[12px] text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                    >
                      <option value="info">Info</option>
                      <option value="event">Event</option>
                      <option value="deal">Deal</option>
                      <option value="alert">Alert</option>
                    </select>
                  </div>
                  <PwaField
                    label="Title"
                    value={n.title}
                    onChange={(title) => updateNotif(i, { title })}
                  />
                  <PwaField
                    label="Body"
                    multiline
                    value={n.body}
                    onChange={(body) => updateNotif(i, { body })}
                  />
                  <PwaField
                    label="Timestamp (ISO)"
                    value={n.timestamp}
                    onChange={(timestamp) => updateNotif(i, { timestamp })}
                  />
                </div>
                <DeleteItemButton label="Delete notification" onClick={() => removeNotif(i)} />
              </div>
            ))
          )}
          <AddItemButton label="Add example notification" onClick={addNotif} />
        </PwaGroup>
      </div>
    </div>
  );
}
