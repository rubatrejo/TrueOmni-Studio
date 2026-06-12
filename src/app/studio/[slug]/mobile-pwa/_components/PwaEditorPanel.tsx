'use client';

import type { PwaConfig } from '@/lib/config';
import { normalizePwaDashboard } from '@/lib/pwa-dashboard';
import type { Branding } from '@/lib/studio/schema';

import { BrandingSyncBanner } from '../../../_components/BrandingSyncBanner';
import { BrandingEditor } from '../../../_components/EditorPanel';
import { PWA_SECTIONS, type PwaSectionKey } from '../_lib/pwa-sections';

import { ConnectWithUsEditor } from './ConnectWithUsEditor';
import { CreateAccountEditor } from './CreateAccountEditor';
import { DealsModuleEditor } from './DealsModuleEditor';
import { DigitalBrochureModuleEditor } from './DigitalBrochureModuleEditor';
import { EventsModuleEditor } from './EventsModuleEditor';
import { ForgotPasswordEditor } from './ForgotPasswordEditor';
import { HelpEditor } from './HelpEditor';
import { ListingsModuleEditor } from './ListingsModuleEditor';
import { LoginEditor } from './LoginEditor';
import { MapModuleEditor } from './MapModuleEditor';
import { ModulesEditor } from './ModulesEditor';
import { MoreEditor } from './MoreEditor';
import { NotificationsEditor } from './NotificationsEditor';
import { PassesModuleEditor } from './PassesModuleEditor';
import { ProfileEditor } from './ProfileEditor';
import { PwaNoLivePreviewBanner, PwaPanelHeader, PwaPlaceholderPanel } from './pwa-ui';
import { PwaAdsEditor } from './PwaAdsEditor';
import { PwaI18nEditor } from './PwaI18nEditor';
import { ScavengerHuntEditor } from './ScavengerHuntEditor';
import { SearchEditor } from './SearchEditor';
import { SocialWallModuleEditor } from './SocialWallModuleEditor';
import { TicketsModuleEditor } from './TicketsModuleEditor';
import { TrailsModuleEditor } from './TrailsModuleEditor';
import { TripPlannerEditor } from './TripPlannerEditor';
import { WayfindingEditor } from './WayfindingEditor';
import { WelcomeEditor } from './WelcomeEditor';

/**
 * Panel central del editor PWA. Renderiza el editor de la sección activa con el
 * mismo chasis (header + scroll) y tamaños que el EditorPanel del kiosk.
 *
 * Branding reutiliza el MISMO `BrandingEditor` del kiosk (mismo UI) sobre el
 * branding compartido del cliente. El resto de secciones edita el slice
 * `features.pwa`. Trip Planner / Módulos / Scavenger Hunt / Wayfinding tienen
 * editor real; el branding y el idioma se previsualizan en vivo.
 */
export function PwaEditorPanel({
  slug,
  sectionKey,
  pwa,
  onPwaChange,
  branding,
  onBrandingChange,
  availableLocales,
  mapboxToken,
}: {
  slug: string;
  sectionKey: PwaSectionKey;
  pwa: PwaConfig;
  onPwaChange: (next: PwaConfig) => void;
  branding: Branding;
  onBrandingChange: (next: Branding) => void;
  /** Idiomas del cliente para el editor i18n (F-PWA-7). */
  availableLocales: string[] | null;
  /** Token Mapbox para el picker de coords del Scavenger Hunt. */
  mapboxToken: string;
}) {
  if (sectionKey === 'branding') {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
        <PwaPanelHeader
          title="Branding & Identity"
          description="Brand colors, logo and typography. Shared with the kiosk — editing here updates every product for this client."
        />
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <BrandingSyncBanner slug={slug} product="pwa" />
          <BrandingEditor branding={branding} onChange={onBrandingChange} />
        </div>
      </div>
    );
  }

  if (sectionKey === 'welcome') {
    return (
      <WelcomeEditor value={pwa.welcome} onChange={(welcome) => onPwaChange({ ...pwa, welcome })} />
    );
  }

  if (sectionKey === 'login') {
    return (
      <LoginEditor
        login={pwa.login}
        loginError={pwa.loginError}
        onChange={(login, loginError) => onPwaChange({ ...pwa, login, loginError })}
      />
    );
  }

  if (sectionKey === 'modules') {
    return (
      <ModulesEditor
        value={pwa.dashboard}
        onChange={(dashboard) =>
          onPwaChange({ ...pwa, dashboard: normalizePwaDashboard(dashboard) })
        }
        logo={branding.logo}
        onLogoChange={(logo) => onBrandingChange({ ...branding, logo: logo ?? '' })}
      />
    );
  }

  if (sectionKey === 'scavenger-hunt') {
    return (
      <ScavengerHuntEditor
        value={pwa.scavengerHunt}
        onChange={(scavengerHunt) => onPwaChange({ ...pwa, scavengerHunt })}
        mapboxToken={mapboxToken}
      />
    );
  }

  if (sectionKey === 'wayfinding') {
    return (
      <WayfindingEditor
        value={pwa.wayfinding}
        onChange={(wayfinding) => onPwaChange({ ...pwa, wayfinding })}
      />
    );
  }

  if (sectionKey === 'trip-planner') {
    return (
      <TripPlannerEditor
        value={pwa.tripPlanner}
        onChange={(tripPlanner) => onPwaChange({ ...pwa, tripPlanner })}
      />
    );
  }

  const LISTINGS_SECTIONS = {
    restaurants: { slice: 'restaurants', title: 'Restaurants' },
    stay: { slice: 'stay', title: 'Places to Stay' },
    'things-to-do': { slice: 'thingsToDo', title: 'Things to Do' },
  } as const;

  if (sectionKey in LISTINGS_SECTIONS) {
    const { slice, title } = LISTINGS_SECTIONS[sectionKey as keyof typeof LISTINGS_SECTIONS];
    return (
      <ListingsModuleEditor
        title={title}
        slug={slug}
        value={pwa[slice]}
        onChange={(next) => onPwaChange({ ...pwa, [slice]: next })}
      />
    );
  }

  if (sectionKey === 'trails') {
    return (
      <TrailsModuleEditor
        value={pwa.trails}
        onChange={(trails) => onPwaChange({ ...pwa, trails })}
      />
    );
  }

  if (sectionKey === 'events') {
    return (
      <EventsModuleEditor
        value={pwa.events}
        onChange={(events) => onPwaChange({ ...pwa, events })}
      />
    );
  }

  if (sectionKey === 'tickets') {
    return (
      <TicketsModuleEditor
        value={pwa.tickets}
        onChange={(tickets) => onPwaChange({ ...pwa, tickets })}
      />
    );
  }

  if (sectionKey === 'deals') {
    return (
      <DealsModuleEditor value={pwa.deals} onChange={(deals) => onPwaChange({ ...pwa, deals })} />
    );
  }

  if (sectionKey === 'passes') {
    return (
      <PassesModuleEditor
        value={pwa.passes}
        onChange={(passes) => onPwaChange({ ...pwa, passes })}
      />
    );
  }

  if (sectionKey === 'map') {
    return <MapModuleEditor value={pwa.map} onChange={(map) => onPwaChange({ ...pwa, map })} />;
  }

  if (sectionKey === 'digital-brochure') {
    return (
      <DigitalBrochureModuleEditor
        value={pwa.digitalBrochure}
        onChange={(digitalBrochure) => onPwaChange({ ...pwa, digitalBrochure })}
      />
    );
  }

  if (sectionKey === 'social-wall') {
    return (
      <SocialWallModuleEditor
        value={pwa.socialWall}
        onChange={(socialWall) => onPwaChange({ ...pwa, socialWall })}
      />
    );
  }

  if (sectionKey === 'connect-with-us') {
    return (
      <ConnectWithUsEditor
        value={pwa.connectWithUs}
        onChange={(connectWithUs) => onPwaChange({ ...pwa, connectWithUs })}
      />
    );
  }

  if (sectionKey === 'help') {
    return <HelpEditor value={pwa.help} onChange={(help) => onPwaChange({ ...pwa, help })} />;
  }

  if (sectionKey === 'search') {
    return (
      <SearchEditor value={pwa.search} onChange={(search) => onPwaChange({ ...pwa, search })} />
    );
  }

  if (sectionKey === 'create-account') {
    return (
      <CreateAccountEditor
        value={pwa.createAccount}
        onChange={(createAccount) => onPwaChange({ ...pwa, createAccount })}
      />
    );
  }

  if (sectionKey === 'forgot-password') {
    return (
      <ForgotPasswordEditor
        value={pwa.forgotPassword}
        onChange={(forgotPassword) => onPwaChange({ ...pwa, forgotPassword })}
      />
    );
  }

  if (sectionKey === 'ads') {
    return <PwaAdsEditor value={pwa.ads} onChange={(ads) => onPwaChange({ ...pwa, ads })} />;
  }

  if (sectionKey === 'languages') {
    // languages va por `studio:locale-update` y recarga el iframe — no hay
    // preview en tiempo real al tipear; se aplica al guardar y recargar.
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PwaNoLivePreviewBanner />
        <PwaI18nEditor value={pwa} onChange={onPwaChange} availableLocales={availableLocales} />
      </div>
    );
  }

  if (sectionKey === 'profile') {
    return (
      <ProfileEditor value={pwa.profile} onChange={(profile) => onPwaChange({ ...pwa, profile })} />
    );
  }

  if (sectionKey === 'notifications') {
    return (
      <NotificationsEditor
        value={pwa.notifications}
        onChange={(notifications) => onPwaChange({ ...pwa, notifications })}
      />
    );
  }

  if (sectionKey === 'more') {
    return <MoreEditor value={pwa.more} onChange={(more) => onPwaChange({ ...pwa, more })} />;
  }

  const section = PWA_SECTIONS.find((s) => s.key === sectionKey);
  const isLive = section?.livePreview ?? true;
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {!isLive && <PwaNoLivePreviewBanner />}
      <PwaPlaceholderPanel
        title={section?.title ?? 'Section'}
        description={section?.description ?? ''}
      />
    </div>
  );
}
