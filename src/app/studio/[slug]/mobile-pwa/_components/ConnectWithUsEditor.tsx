'use client';

import type { PwaConnectWithUsConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

// ---------- Helpers de validación de URL ----------

/** Devuelve un aviso si el valor no parsea como URL válida; null si es válido o vacío. */
function urlHint(value: string): string | null {
  if (!value.trim()) return null;
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return null;
  } catch {
    return 'Looks invalid — include https://';
  }
}

/** Muestra el aviso de validación bajo un campo de URL. No renderiza nada si no hay aviso. */
function FieldHint({ hint }: { hint: string | null }) {
  if (!hint) return null;
  return <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">{hint}</p>;
}

/**
 * Editor de la pantalla "Connect With Us" de la PWA (`ConnectWithUsScreen`). Edita
 * los textos white-label y los datos de contacto (redes, teléfono, web, dirección,
 * horario). El logo grande es el del branding y el footer "powered by" es marca
 * fija del producto (no se editan aquí); la tabla semanal de horarios
 * (`hours.schedule`) viene del setup. El copyright admite `{client_name}`,
 * `{city}`, `{year}` y `statusTemplate` admite `{close}` (interpolados en runtime).
 */

const EMPTY = {
  title: '',
  orgName: '',
  address: '',
  copyright: '',
  city: '',
  phone: '',
  website: '',
  social: {} as NonNullable<PwaConnectWithUsConfig['social']>,
  actions: { call: '', website: '', directions: '' },
};

export function ConnectWithUsEditor({
  value,
  onChange,
}: {
  value: PwaConnectWithUsConfig | undefined;
  onChange: (next: PwaConnectWithUsConfig) => void;
}) {
  const v: PwaConnectWithUsConfig = {
    ...EMPTY,
    ...value,
    social: { ...value?.social },
    actions: { ...EMPTY.actions, ...value?.actions },
  };
  const social = v.social ?? {};
  const actions = v.actions ?? EMPTY.actions;
  const hours = v.hours ?? { statusTemplate: '', schedule: [] };
  const setSocial = (patch: Partial<NonNullable<PwaConnectWithUsConfig['social']>>) =>
    onChange({ ...v, social: { ...social, ...patch } });
  const setActions = (patch: Partial<NonNullable<PwaConnectWithUsConfig['actions']>>) =>
    onChange({ ...v, actions: { ...actions, ...patch } });
  const setHours = (patch: Partial<NonNullable<PwaConnectWithUsConfig['hours']>>) =>
    onChange({ ...v, hours: { ...hours, ...patch } });

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Connect With Us"
        description="White-label texts and contact details (socials, phone, website, address, hours). The weekly schedule comes from the setup."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="General">
          <PwaField
            label="Title"
            value={v.title ?? ''}
            onChange={(title) => onChange({ ...v, title })}
          />
          <PwaField
            label="Organization name (falls back to client name)"
            value={v.orgName ?? ''}
            onChange={(orgName) => onChange({ ...v, orgName })}
          />
          <PwaField
            label="Address"
            value={v.address ?? ''}
            onChange={(address) => onChange({ ...v, address })}
          />
          <PwaField
            label="Copyright (supports {client_name}, {city}, {year})"
            value={v.copyright ?? ''}
            onChange={(copyright) => onChange({ ...v, copyright })}
            multiline
          />
          <PwaField
            label="City (interpolated in {city})"
            value={v.city ?? ''}
            onChange={(city) => onChange({ ...v, city })}
          />
        </PwaGroup>

        <PwaGroup title="Contact">
          <PwaField
            label="Phone"
            value={v.phone ?? ''}
            onChange={(phone) => onChange({ ...v, phone })}
          />
          <div>
            <PwaField
              label="Website URL"
              value={v.website ?? ''}
              onChange={(website) => onChange({ ...v, website })}
            />
            <FieldHint hint={urlHint(v.website ?? '')} />
          </div>
          <PwaField
            label="Call action"
            value={actions.call}
            onChange={(call) => setActions({ call })}
          />
          <PwaField
            label="Website action"
            value={actions.website}
            onChange={(website) => setActions({ website })}
          />
          <PwaField
            label="Directions action"
            value={actions.directions}
            onChange={(directions) => setActions({ directions })}
          />
        </PwaGroup>

        <PwaGroup title="Social URLs">
          <div>
            <PwaField
              label="X (Twitter)"
              value={social.x ?? ''}
              onChange={(x) => setSocial({ x })}
            />
            <FieldHint hint={urlHint(social.x ?? '')} />
          </div>
          <div>
            <PwaField
              label="Facebook"
              value={social.facebook ?? ''}
              onChange={(facebook) => setSocial({ facebook })}
            />
            <FieldHint hint={urlHint(social.facebook ?? '')} />
          </div>
          <div>
            <PwaField
              label="Instagram"
              value={social.instagram ?? ''}
              onChange={(instagram) => setSocial({ instagram })}
            />
            <FieldHint hint={urlHint(social.instagram ?? '')} />
          </div>
          <div>
            <PwaField
              label="Pinterest"
              value={social.pinterest ?? ''}
              onChange={(pinterest) => setSocial({ pinterest })}
            />
            <FieldHint hint={urlHint(social.pinterest ?? '')} />
          </div>
        </PwaGroup>

        <PwaGroup title="Hours">
          <PwaField
            label="Status template (supports {close})"
            value={hours.statusTemplate}
            onChange={(statusTemplate) => setHours({ statusTemplate })}
          />
          <PwaField
            label="Today's closing time"
            value={hours.todayClose ?? ''}
            onChange={(todayClose) => setHours({ todayClose })}
          />
          <PwaField
            label="Hours modal title"
            value={hours.modalTitle ?? ''}
            onChange={(modalTitle) => setHours({ modalTitle })}
          />
        </PwaGroup>
      </div>
    </div>
  );
}
