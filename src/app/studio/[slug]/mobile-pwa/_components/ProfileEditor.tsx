'use client';

import type { PwaProfileConfig } from '@/lib/config';

import { PwaField, PwaGroup, PwaOptionList, PwaPanelHeader } from './pwa-ui';

/**
 * Editor de la sección Profile de la PWA (perfil + edit + settings + change
 * password + delete account). Edita SOLO los textos white-label: títulos de
 * sección, labels, placeholders y los textos de los flujos. La data de demo
 * (usuario, cards de favoritos / eventos, valores de prefill) viene del setup y
 * no se edita aquí. Los placeholders del Edit Profile no se exponen porque la
 * pantalla no los renderiza.
 */

const EMPTY: PwaProfileConfig = {
  editProfileLink: '',
  user: { name: '', location: '', weather: '', photo: '', heroImage: '' },
  favorites: { title: '', viewMore: '', items: [] },
  upcomingEvents: { title: '', viewMore: '', items: [] },
  editProfile: {
    title: '',
    editPhoto: '',
    namePlaceholder: '',
    emailPlaceholder: '',
    statePlaceholder: '',
    zipPlaceholder: '',
    countryPlaceholder: '',
    changePasswordCta: '',
    saveCta: '',
    prefill: { name: '', email: '', state: '', zip: '', country: '' },
  },
  changePassword: {
    title: '',
    body: '',
    newPlaceholder: '',
    confirmPlaceholder: '',
    helper: '',
    establishCta: '',
    error: { title: '', body: '', tryAgainCta: '', closeCta: '' },
    success: { title: '', doneCta: '' },
  },
  settings: { title: '', deleteRow: '' },
  delete: {
    title: '',
    surveyTitle: '',
    reason: { heading: '', options: [], continueCta: '' },
    other: { heading: '', placeholder: '', continueCta: '' },
    confirm: {
      heading: '',
      sendDataLabel: '',
      passwordPlaceholder: '',
      warning: '',
      continueCta: '',
    },
    survey: { question: '', options: [], deleteCta: '' },
  },
};

export function ProfileEditor({
  value,
  onChange,
}: {
  value: PwaProfileConfig | undefined;
  onChange: (next: PwaProfileConfig) => void;
}) {
  const v: PwaProfileConfig = {
    ...EMPTY,
    ...value,
    user: { ...EMPTY.user, ...value?.user },
    favorites: { ...EMPTY.favorites, ...value?.favorites, items: value?.favorites?.items ?? [] },
    upcomingEvents: {
      ...EMPTY.upcomingEvents,
      ...value?.upcomingEvents,
      items: value?.upcomingEvents?.items ?? [],
    },
    editProfile: { ...EMPTY.editProfile, ...value?.editProfile },
    changePassword: {
      ...EMPTY.changePassword,
      ...value?.changePassword,
      error: { ...EMPTY.changePassword.error, ...value?.changePassword?.error },
      success: { ...EMPTY.changePassword.success, ...value?.changePassword?.success },
    },
    settings: { ...EMPTY.settings, ...value?.settings },
    delete: {
      ...EMPTY.delete,
      ...value?.delete,
      reason: { ...EMPTY.delete.reason, ...value?.delete?.reason },
      other: { ...EMPTY.delete.other, ...value?.delete?.other },
      confirm: { ...EMPTY.delete.confirm, ...value?.delete?.confirm },
      survey: { ...EMPTY.delete.survey, ...value?.delete?.survey },
    },
  };

  const ep = v.editProfile;
  const cp = v.changePassword;
  const d = v.delete;

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Profile & Account"
        description="White-label texts of the profile, edit, settings, change-password and delete-account screens."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="Profile">
          <PwaField
            label="Edit profile link"
            value={v.editProfileLink}
            onChange={(editProfileLink) => onChange({ ...v, editProfileLink })}
          />
        </PwaGroup>

        <PwaGroup title="Favorites section">
          <PwaField
            label="Title"
            value={v.favorites.title}
            onChange={(title) => onChange({ ...v, favorites: { ...v.favorites, title } })}
          />
          <PwaField
            label="View more"
            value={v.favorites.viewMore}
            onChange={(viewMore) => onChange({ ...v, favorites: { ...v.favorites, viewMore } })}
          />
        </PwaGroup>

        <PwaGroup title="Upcoming events section">
          <PwaField
            label="Title"
            value={v.upcomingEvents.title}
            onChange={(title) => onChange({ ...v, upcomingEvents: { ...v.upcomingEvents, title } })}
          />
          <PwaField
            label="View more"
            value={v.upcomingEvents.viewMore}
            onChange={(viewMore) =>
              onChange({ ...v, upcomingEvents: { ...v.upcomingEvents, viewMore } })
            }
          />
        </PwaGroup>

        <PwaGroup title="Edit profile">
          <PwaField
            label="Title"
            value={ep.title}
            onChange={(title) => onChange({ ...v, editProfile: { ...ep, title } })}
          />
          <PwaField
            label="Edit photo"
            value={ep.editPhoto}
            onChange={(editPhoto) => onChange({ ...v, editProfile: { ...ep, editPhoto } })}
          />
          <PwaField
            label="Change password button"
            value={ep.changePasswordCta}
            onChange={(changePasswordCta) =>
              onChange({ ...v, editProfile: { ...ep, changePasswordCta } })
            }
          />
          <PwaField
            label="Save button"
            value={ep.saveCta}
            onChange={(saveCta) => onChange({ ...v, editProfile: { ...ep, saveCta } })}
          />
        </PwaGroup>

        <PwaGroup title="Change password">
          <PwaField
            label="Title"
            value={cp.title}
            onChange={(title) => onChange({ ...v, changePassword: { ...cp, title } })}
          />
          <PwaField
            label="Body"
            multiline
            value={cp.body}
            onChange={(body) => onChange({ ...v, changePassword: { ...cp, body } })}
          />
          <PwaField
            label="New password placeholder"
            value={cp.newPlaceholder}
            onChange={(newPlaceholder) =>
              onChange({ ...v, changePassword: { ...cp, newPlaceholder } })
            }
          />
          <PwaField
            label="Confirm password placeholder"
            value={cp.confirmPlaceholder}
            onChange={(confirmPlaceholder) =>
              onChange({ ...v, changePassword: { ...cp, confirmPlaceholder } })
            }
          />
          <PwaField
            label="Helper text"
            value={cp.helper}
            onChange={(helper) => onChange({ ...v, changePassword: { ...cp, helper } })}
          />
          <PwaField
            label="Establish button"
            value={cp.establishCta}
            onChange={(establishCta) => onChange({ ...v, changePassword: { ...cp, establishCta } })}
          />
          <PwaField
            label="Error · title"
            value={cp.error.title}
            onChange={(title) =>
              onChange({ ...v, changePassword: { ...cp, error: { ...cp.error, title } } })
            }
          />
          <PwaField
            label="Error · body"
            multiline
            value={cp.error.body}
            onChange={(body) =>
              onChange({ ...v, changePassword: { ...cp, error: { ...cp.error, body } } })
            }
          />
          <PwaField
            label="Error · try again"
            value={cp.error.tryAgainCta}
            onChange={(tryAgainCta) =>
              onChange({ ...v, changePassword: { ...cp, error: { ...cp.error, tryAgainCta } } })
            }
          />
          <PwaField
            label="Error · close"
            value={cp.error.closeCta}
            onChange={(closeCta) =>
              onChange({ ...v, changePassword: { ...cp, error: { ...cp.error, closeCta } } })
            }
          />
          <PwaField
            label="Success · title"
            value={cp.success.title}
            onChange={(title) =>
              onChange({ ...v, changePassword: { ...cp, success: { ...cp.success, title } } })
            }
          />
          <PwaField
            label="Success · done"
            value={cp.success.doneCta}
            onChange={(doneCta) =>
              onChange({ ...v, changePassword: { ...cp, success: { ...cp.success, doneCta } } })
            }
          />
        </PwaGroup>

        <PwaGroup title="Settings">
          <PwaField
            label="Title"
            value={v.settings.title}
            onChange={(title) => onChange({ ...v, settings: { ...v.settings, title } })}
          />
          <PwaField
            label="Delete row"
            value={v.settings.deleteRow}
            onChange={(deleteRow) => onChange({ ...v, settings: { ...v.settings, deleteRow } })}
          />
        </PwaGroup>

        <PwaGroup title="Delete account">
          <PwaField
            label="Title"
            value={d.title}
            onChange={(title) => onChange({ ...v, delete: { ...d, title } })}
          />
          <PwaField
            label="Survey title"
            value={d.surveyTitle}
            onChange={(surveyTitle) => onChange({ ...v, delete: { ...d, surveyTitle } })}
          />
          <PwaField
            label="Reason · heading"
            value={d.reason.heading}
            onChange={(heading) =>
              onChange({ ...v, delete: { ...d, reason: { ...d.reason, heading } } })
            }
          />
          <PwaOptionList
            label="Reason · option"
            options={d.reason.options}
            onChange={(options) =>
              onChange({ ...v, delete: { ...d, reason: { ...d.reason, options } } })
            }
          />
          <PwaField
            label="Reason · continue"
            value={d.reason.continueCta}
            onChange={(continueCta) =>
              onChange({ ...v, delete: { ...d, reason: { ...d.reason, continueCta } } })
            }
          />
          <PwaField
            label="Other · heading"
            value={d.other.heading}
            onChange={(heading) =>
              onChange({ ...v, delete: { ...d, other: { ...d.other, heading } } })
            }
          />
          <PwaField
            label="Other · placeholder"
            value={d.other.placeholder}
            onChange={(placeholder) =>
              onChange({ ...v, delete: { ...d, other: { ...d.other, placeholder } } })
            }
          />
          <PwaField
            label="Other · continue"
            value={d.other.continueCta}
            onChange={(continueCta) =>
              onChange({ ...v, delete: { ...d, other: { ...d.other, continueCta } } })
            }
          />
          <PwaField
            label="Confirm · heading"
            value={d.confirm.heading}
            onChange={(heading) =>
              onChange({ ...v, delete: { ...d, confirm: { ...d.confirm, heading } } })
            }
          />
          <PwaField
            label="Confirm · send data label"
            value={d.confirm.sendDataLabel}
            onChange={(sendDataLabel) =>
              onChange({ ...v, delete: { ...d, confirm: { ...d.confirm, sendDataLabel } } })
            }
          />
          <PwaField
            label="Confirm · password placeholder"
            value={d.confirm.passwordPlaceholder}
            onChange={(passwordPlaceholder) =>
              onChange({
                ...v,
                delete: { ...d, confirm: { ...d.confirm, passwordPlaceholder } },
              })
            }
          />
          <PwaField
            label="Confirm · warning"
            multiline
            value={d.confirm.warning}
            onChange={(warning) =>
              onChange({ ...v, delete: { ...d, confirm: { ...d.confirm, warning } } })
            }
          />
          <PwaField
            label="Confirm · continue"
            value={d.confirm.continueCta}
            onChange={(continueCta) =>
              onChange({ ...v, delete: { ...d, confirm: { ...d.confirm, continueCta } } })
            }
          />
          <PwaField
            label="Survey · question"
            value={d.survey.question}
            onChange={(question) =>
              onChange({ ...v, delete: { ...d, survey: { ...d.survey, question } } })
            }
          />
          <PwaOptionList
            label="Survey · option"
            options={d.survey.options}
            onChange={(options) =>
              onChange({ ...v, delete: { ...d, survey: { ...d.survey, options } } })
            }
          />
          <PwaField
            label="Survey · delete"
            value={d.survey.deleteCta}
            onChange={(deleteCta) =>
              onChange({ ...v, delete: { ...d, survey: { ...d.survey, deleteCta } } })
            }
          />
        </PwaGroup>
      </div>
    </div>
  );
}
