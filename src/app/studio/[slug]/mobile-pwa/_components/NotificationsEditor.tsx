'use client';

import type { PwaNotificationsConfig } from '@/lib/config';

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
      </div>
    </div>
  );
}
