'use client';

import type { PwaCreateAccountConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaPanelHeader } from './pwa-ui';

/**
 * Editor del flujo "Create Account" de la PWA: paso 1 (`CreateAccountScreen`,
 * formulario) + pasos 2-4 (`CreateAccountPhotoScreen`, subir foto). Solo textos
 * white-label; la lista de países (`countries`) viene del setup y no se edita aquí.
 */

const EMPTY: PwaCreateAccountConfig = {
  title: '',
  namePlaceholder: '',
  emailPlaceholder: '',
  countryPlaceholder: '',
  statePlaceholder: '',
  zipPlaceholder: '',
  passwordPlaceholder: '',
  confirmPasswordPlaceholder: '',
  helperText: '',
  signUpCta: '',
  countries: [],
  countrySheetTitle: '',
  error: { title: '', body: '', okCta: '' },
  photo: {
    title: '',
    subtitle: '',
    addPhoto: '',
    fullNameFallback: '',
    skipCta: '',
    saveCta: '',
    cancelCta: '',
    takePhoto: '',
    chooseGallery: '',
    cancelSheet: '',
    sizeHint: '',
  },
};

export function CreateAccountEditor({
  value,
  onChange,
}: {
  value: PwaCreateAccountConfig | undefined;
  onChange: (next: PwaCreateAccountConfig) => void;
}) {
  const v: PwaCreateAccountConfig = {
    ...EMPTY,
    ...value,
    countries: value?.countries ?? [],
    error: { ...EMPTY.error, ...value?.error },
    photo: { ...EMPTY.photo, ...value?.photo },
  };
  const e = v.error;
  const p = v.photo;
  const setError = (patch: Partial<PwaCreateAccountConfig['error']>) =>
    onChange({ ...v, error: { ...e, ...patch } });
  const setPhoto = (patch: Partial<PwaCreateAccountConfig['photo']>) =>
    onChange({ ...v, photo: { ...p, ...patch } });

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Create Account"
        description="White-label texts of the sign-up flow: the form, the validation dialog and the upload-photo step. Country list comes from the setup."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="Form">
          <PwaField label="Title" value={v.title} onChange={(title) => onChange({ ...v, title })} />
          <PwaField
            label="Name placeholder"
            value={v.namePlaceholder}
            onChange={(namePlaceholder) => onChange({ ...v, namePlaceholder })}
          />
          <PwaField
            label="Email placeholder"
            value={v.emailPlaceholder}
            onChange={(emailPlaceholder) => onChange({ ...v, emailPlaceholder })}
          />
          <PwaField
            label="Country placeholder"
            value={v.countryPlaceholder}
            onChange={(countryPlaceholder) => onChange({ ...v, countryPlaceholder })}
          />
          <PwaField
            label="State placeholder"
            value={v.statePlaceholder}
            onChange={(statePlaceholder) => onChange({ ...v, statePlaceholder })}
          />
          <PwaField
            label="Zip placeholder"
            value={v.zipPlaceholder}
            onChange={(zipPlaceholder) => onChange({ ...v, zipPlaceholder })}
          />
          <PwaField
            label="Password placeholder"
            value={v.passwordPlaceholder}
            onChange={(passwordPlaceholder) => onChange({ ...v, passwordPlaceholder })}
          />
          <PwaField
            label="Confirm password placeholder"
            value={v.confirmPasswordPlaceholder}
            onChange={(confirmPasswordPlaceholder) =>
              onChange({ ...v, confirmPasswordPlaceholder })
            }
          />
          <PwaField
            label="Password helper text"
            value={v.helperText}
            onChange={(helperText) => onChange({ ...v, helperText })}
            multiline
          />
          <PwaField
            label="Sign up button"
            value={v.signUpCta}
            onChange={(signUpCta) => onChange({ ...v, signUpCta })}
          />
          <PwaField
            label="Country sheet title"
            value={v.countrySheetTitle}
            onChange={(countrySheetTitle) => onChange({ ...v, countrySheetTitle })}
          />
        </PwaGroup>

        <PwaGroup title="Validation dialog">
          <PwaField label="Title" value={e.title} onChange={(title) => setError({ title })} />
          <PwaField label="Body" value={e.body} onChange={(body) => setError({ body })} multiline />
          <PwaField label="OK button" value={e.okCta} onChange={(okCta) => setError({ okCta })} />
        </PwaGroup>

        <PwaGroup title="Upload photo">
          <PwaField label="Title" value={p.title} onChange={(title) => setPhoto({ title })} />
          <PwaField
            label="Subtitle"
            value={p.subtitle}
            onChange={(subtitle) => setPhoto({ subtitle })}
          />
          <PwaField
            label="Add photo"
            value={p.addPhoto}
            onChange={(addPhoto) => setPhoto({ addPhoto })}
          />
          <PwaField
            label="Full name fallback"
            value={p.fullNameFallback}
            onChange={(fullNameFallback) => setPhoto({ fullNameFallback })}
          />
          <PwaField
            label="Skip button"
            value={p.skipCta}
            onChange={(skipCta) => setPhoto({ skipCta })}
          />
          <PwaField
            label="Save button"
            value={p.saveCta}
            onChange={(saveCta) => setPhoto({ saveCta })}
          />
          <PwaField
            label="Cancel button"
            value={p.cancelCta}
            onChange={(cancelCta) => setPhoto({ cancelCta })}
          />
          <PwaField
            label="Take photo"
            value={p.takePhoto}
            onChange={(takePhoto) => setPhoto({ takePhoto })}
          />
          <PwaField
            label="Choose from gallery"
            value={p.chooseGallery}
            onChange={(chooseGallery) => setPhoto({ chooseGallery })}
          />
          <PwaField
            label="Cancel sheet"
            value={p.cancelSheet}
            onChange={(cancelSheet) => setPhoto({ cancelSheet })}
          />
          <PwaField
            label="Size hint"
            value={p.sizeHint}
            onChange={(sizeHint) => setPhoto({ sizeHint })}
            multiline
          />
        </PwaGroup>
      </div>
    </div>
  );
}
