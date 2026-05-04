import Link from 'next/link';
import { notFound } from 'next/navigation';

import { AdsSlot } from '@/components/ads/ads-slot';
import { DealsModule } from '@/components/deals/deals-module';
import { BrochuresModule } from '@/components/digital-brochure/brochures-module';
import { EventsModule } from '@/components/events/events-module';
import { GuestbookModule } from '@/components/guestbook/guestbook-module';
import { HomeHeader } from '@/components/home/header';
import { KioskCanvas } from '@/components/kiosk-canvas';
import { ListingsModule } from '@/components/listings/listings-module';
import { MapModule } from '@/components/map/map-module';
import { PassesModule } from '@/components/passes/passes-module';
import { SocialWallModule } from '@/components/social-wall/social-wall-module';
import { TicketsModule } from '@/components/tickets/tickets-module';
import { TrailsModule } from '@/components/trails/trails-module';
import { getAdsFromConfig } from '@/lib/ads';
import { getConfig } from '@/lib/config';
import { getMapItems } from '@/lib/map-aggregator';
import { buildMapDetailLookup } from '@/lib/map-detail-lookup';

interface PageProps {
  params: Promise<{ module: string }>;
}

/**
 * Ruta dinámica del módulo.
 *   - Si `features.home.modules[module]` existe → renderiza ListingsModule
 *     (Restaurants / Things to Do / Stay).
 *   - Si `module === 'wayfinding'` o está entre los tiles habilitados →
 *     placeholder "Coming soon".
 *   - Si no existe → notFound.
 */
export default async function ModulePage({ params }: PageProps) {
  const { module } = await params;
  const config = await getConfig();
  const home = config.features?.home;
  if (!home) notFound();
  const ads = getAdsFromConfig(config);

  // Módulos: detectamos `kind`. Social Wall / Events / Listings.
  const mod = home.modules?.[module];
  if (mod?.kind === 'digital-brochure') {
    return (
      <KioskCanvas>
        <BrochuresModule
          moduleKey={module}
          module={mod}
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }
  if (mod?.kind === 'social-wall') {
    return (
      <KioskCanvas>
        <SocialWallModule
          moduleKey={module}
          module={mod}
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }
  if (mod?.kind === 'events') {
    return (
      <KioskCanvas>
        <EventsModule
          moduleKey={module}
          module={mod}
          clientCoords={config.client.coords}
          clientTimezone={config.client.timezone}
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }
  if (mod?.kind === 'map') {
    const t = config.textos ?? {};
    const openUntilPrefix = t.map_open_until_prefix ?? 'Open until';
    const items = getMapItems(config, mod, { openUntilPrefix });
    const detailLookup = buildMapDetailLookup(config, mod, items);
    const clientName = config.client.nombre;
    const applyTemplate = (s: string) => s.replace(/\{client\}/g, clientName);
    // exploreTitle se pasa con el template `{client}` SIN interpolar — el
    // MapModule lo re-interpola client-side con el `clientName` reactivo
    // que recibe del bridge del Studio. En kiosk runtime normal (sin
    // Studio), el bridge nunca dispatcha y el MapModule cae al server-
    // rendered usando `client.nombre` del config.
    const exploreTitle = t.map_explore_title ?? `Explore {client} Map`;
    const resolvedWelcomeCopy = mod.welcomeCopy
      ? {
          ...mod.welcomeCopy,
          title: applyTemplate(mod.welcomeCopy.title),
          body: applyTemplate(mod.welcomeCopy.body),
          subtitle: mod.welcomeCopy.subtitle ? applyTemplate(mod.welcomeCopy.subtitle) : undefined,
          cta: applyTemplate(mod.welcomeCopy.cta),
        }
      : undefined;
    const resolvedMod = resolvedWelcomeCopy ? { ...mod, welcomeCopy: resolvedWelcomeCopy } : mod;
    return (
      <KioskCanvas>
        <MapModule
          moduleKey={module}
          module={resolvedMod}
          clientCoords={config.client.coords}
          clientName={clientName}
          mapboxToken={config.integraciones?.mapbox_token}
          items={items}
          detailLookup={detailLookup}
          textos={{
            seeMoreInfo: t.map_see_more_info ?? 'SEE MORE INFO',
            addToItinerary: t.map_add_to_itinerary ?? 'ADD TO ITINERARY',
            addedToItinerary: t.map_added_to_itinerary ?? 'ADDED TO ITINERARY',
            miAwaySuffix: t.map_mi_away_suffix ?? 'mi away',
            minWalkingSuffix: t.map_min_walking_suffix ?? 'min',
            filtersTitle: t.map_filters_title ?? 'FILTERS',
            clearAll: t.map_clear_all ?? 'CLEAR ALL',
            apply: t.map_apply ?? 'APPLY',
            featuresLabel: t.map_features_label,
            subcategoriesLabel: t.map_subcategories_label,
            selectAll: t.map_select_all ?? 'Select All',
            exploreTitle,
          }}
          header={<HomeHeader heroImage={null} showLanguage={false} height={620} />}
        />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }
  if (mod?.kind === 'passes') {
    return (
      <KioskCanvas>
        <PassesModule
          moduleKey={module}
          module={mod}
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }
  if (mod?.kind === 'tickets') {
    const eventsModule = config.features?.home?.modules?.events;
    const allEvents = eventsModule && eventsModule.kind === 'events' ? eventsModule.events : [];
    return (
      <KioskCanvas>
        <TicketsModule
          moduleKey={module}
          module={mod}
          allEvents={allEvents}
          clientCoords={config.client.coords}
          clientTimezone={config.client.timezone}
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }
  if (mod?.kind === 'deals') {
    return (
      <KioskCanvas>
        <DealsModule
          moduleKey={module}
          module={mod}
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }
  if (mod?.kind === 'trails') {
    return (
      <KioskCanvas>
        <TrailsModule
          moduleKey={module}
          module={mod}
          clientCoords={config.client.coords}
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }
  if (mod?.kind === 'guestbook') {
    return (
      <KioskCanvas>
        <GuestbookModule
          module={mod}
          mapboxToken={config.integraciones?.mapbox_token}
          clientFallbackCoords={config.client.coords}
          startHeader={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
          formHeader={
            <HomeHeader heroImage={null} showLanguage={false} height={180} gradientExtra={80} />
          }
          mapHeader={
            <HomeHeader heroImage={null} showLanguage={false} height={180} gradientExtra={80} />
          }
        />
      </KioskCanvas>
    );
  }
  if (mod) {
    return (
      <KioskCanvas>
        <ListingsModule
          moduleKey={module}
          module={mod}
          clientCoords={config.client.coords}
          header={<HomeHeader heroImage={mod.heroImage} showLanguage={false} />}
        />
        <AdsSlot ads={ads} />
      </KioskCanvas>
    );
  }

  // Validar que el módulo exista como tile (placeholder stub) o como wayfinding
  const tile = home.tiles.find((t) => t.key === module);
  const isWayfinding = module === 'wayfinding' && home.wayfinding?.enabled;
  if (!tile && !isWayfinding) notFound();

  const label = tile?.label ?? home.wayfinding?.label ?? module;
  const stubTextos = config.textos ?? {};
  const comingSoonText = stubTextos.module_stub_coming_soon ?? 'Coming soon';
  const backToHomeText = stubTextos.module_stub_back_to_home ?? 'Back to Home';
  return (
    <KioskCanvas>
      <div className="flex h-full w-full flex-col items-center justify-center gap-10 bg-white px-10 text-center">
        <h1
          className="font-display font-bold uppercase"
          style={{ fontSize: '90px', letterSpacing: '0.02em', color: 'hsl(var(--brand-primary))' }}
        >
          {label}
        </h1>
        <p className="font-sans text-gray-600" style={{ fontSize: '32px' }}>
          {comingSoonText}
        </p>
        <Link
          href="/home"
          className="mt-4 inline-flex items-center justify-center rounded-[10px] font-sans font-bold uppercase text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          style={{ fontSize: '26px', padding: '16px 40px', letterSpacing: '0.02em', backgroundColor: 'hsl(var(--brand-primary))' }}
        >
          {backToHomeText}
        </Link>
      </div>
    </KioskCanvas>
  );
}
