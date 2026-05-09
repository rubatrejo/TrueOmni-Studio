'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useSubcategoryLabel, useTextos } from '@/components/i18n-provider';
import {
  KIOSK_CLIENT_COORDS_OVERRIDE_EVENT,
  getCachedClientCoords,
} from '@/components/studio-bridge';
import type { Listing } from '@/lib/config';
import { useEventFavorites, useFavorites, useTrailFavorites } from '@/lib/favorites';

import { DirectionsModal } from './directions-modal';
import { FavoriteAddedToast } from './favorite-added-toast';
import { MapboxMap } from './mapbox-map';
import { SendConfirmationPopup } from './send-confirmation-popup';
import { SendToEmailModal } from './send-to-email-modal';
import { SendToPhoneModal } from './send-to-phone-modal';
import { Threshold360Modal } from './threshold360-modal';

/**
 * Detail screen verbatim SVG `Food & Drink – Detail`.
 *
 * Canvas global 1080×1920 con overlay `rgba(0,0,0,0.8)` detrás del card.
 * Card blanco 898×1589 rx=8 at (90, 166). Todas las coords en componentes
 * hijos son relativas al card.
 */
export interface EventMeta {
  /** ISO YYYY-MM-DD. */
  date: string;
  /** 'HH:MM' 24h. */
  startTime: string;
  /** 'HH:MM' 24h. */
  endTime: string;
  /** Texto ya formateado (ej: "February 27, 2026"). Si ausente se usa `date`. */
  dateLabel?: string;
  /** Texto ya formateado (ej: "7:00 – 10:00 PM"). Si ausente se construye. */
  timeLabel?: string;
}

export interface SecondaryCta {
  label: string;
  /** Si se da, el detail resuelve esta key via i18n y la usa en lugar de `label`. */
  labelKey?: string;
  /** URL externa (apertura en tab nueva). Mutuamente exclusivo con onClick. */
  href?: string;
  /** Callback sincrónico. Mutuamente exclusivo con href. */
  onClick?: () => void;
  /** Color temático del botón. Default 'blue'. */
  color?: 'blue' | 'olive' | 'outline-red';
}

export function ListingDetail({
  moduleKey,
  listing,
  mapboxToken,
  clientCoords,
  eventMeta,
  secondaryCta,
  favoritesKind = 'listing',
  onClose,
  extraDetails,
  mapSlot,
  stickyBuyCta,
  eventMetaOnHero = false,
  cardHeight,
  contentHeight,
}: {
  moduleKey: string;
  listing: Listing;
  mapboxToken: string | undefined;
  /** Coords del cliente para la ruta del DirectionsModal. */
  clientCoords?: { lat: number; lng: number };
  /** Si presente → la línea superior se formatea como evento (fecha + horario). */
  eventMeta?: EventMeta;
  /** Si presente y no hay `listing.reserveUrl` → se muestra en ese slot (GET TICKETS). */
  secondaryCta?: SecondaryCta;
  /** Discriminador del bucket de favoritos. `'event'` usa `useEventFavorites`. */
  favoritesKind?: 'listing' | 'event' | 'trail';
  /** Si se provee, el botón X usa esta callback en lugar de navegar al módulo. */
  onClose?: () => void;
  /** Slot opcional (Tickets/Trails) renderizado entre Map y DESCRIPTION. */
  extraDetails?: React.ReactNode;
  /**
   * Slot opcional que reemplaza el bloque `MapSection` completo
   * (mapa + divider + address + GET DIRECTIONS). Trails lo usa para
   * inyectar `<TrailMapTabs>` con su propio chrome.
   */
  mapSlot?: React.ReactNode;
  /** CTA full-width sticky en el bottom del card (Tickets). Si presente, card crece +140px. */
  stickyBuyCta?: { label: string; priceDisplay: string; onClick: () => void };
  /** Si true, el `eventMeta` se renderea sobre el hero con gradient oscuro (Tickets). */
  eventMetaOnHero?: boolean;
  /** Override de la altura del card visible (viewport). Default 1589. */
  cardHeight?: number;
  /**
   * Override de la altura del contenido intrínseco (wrapper interno). Si
   * excede `cardHeight` el card gana scroll vertical. Default = cardHeight
   * (sin scroll). Usar cuando `extraDetails` añade contenido que no cabe
   * en el viewport estándar (ej. Trails Considerations).
   */
  contentHeight?: number;
}) {
  const [emailOpen, setEmailOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | {
    kind: 'email' | 'phone';
    destination: string;
  }>(null);
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const [threshold360Open, setThreshold360Open] = useState(false);

  // Reactive client coords del bridge del Studio. El DirectionsModal y el
  // MapboxMap usan estas coords para origin de la ruta y centro de mapa.
  // Sin esto, "Get Directions" en un kiosk de Florida seguía centrando
  // en Phoenix.
  const [reactiveCoords, setReactiveCoords] = useState<{ lat: number; lng: number } | undefined>(
    () => getCachedClientCoords() ?? clientCoords,
  );
  useEffect(() => {
    const onOverride = (event: Event) => {
      const detail = (event as CustomEvent<{ coords?: { lat: number; lng: number } }>).detail;
      if (detail?.coords) setReactiveCoords(detail.coords);
    };
    window.addEventListener(KIOSK_CLIENT_COORDS_OVERRIDE_EVENT, onOverride);
    return () => window.removeEventListener(KIOSK_CLIENT_COORDS_OVERRIDE_EVENT, onOverride);
  }, []);
  const effectiveClientCoords = reactiveCoords ?? clientCoords;

  const openEmail = () => setEmailOpen(true);
  const openPhone = () => setPhoneOpen(true);
  const handleEmailSent = (email: string) => {
    setEmailOpen(false);
    setConfirm({ kind: 'email', destination: email });
  };
  const handlePhoneSent = (phone: string) => {
    setPhoneOpen(false);
    setConfirm({ kind: 'phone', destination: phone });
  };

  return (
    <div className="absolute inset-0 z-20 h-full w-full">
      {/* Overlay oscuro que deja ver el grid detrás */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      />

      {/* Card blanco 898×cardHeight at (90, 166). Contenedor scrollable:
          el card outer mantiene altura visible fija; el wrapper interno
          define la altura intrínseca del contenido (`contentHeight`).
          Si contentHeight > cardHeight, el card gana scroll vertical. */}
      <div
        style={{
          position: 'absolute',
          left: '90px',
          top: '166px',
          width: '898px',
          height: `${cardHeight ?? 1589}px`,
          borderRadius: '8px',
          boxShadow: '0 12px 24px rgba(0,0,0,0.25)',
        }}
      >
        {/* Scroll-hint gradient: pista visual de que hay más contenido abajo.
            Solo se muestra si el contenido excede la altura visible. */}
        {contentHeight && contentHeight > (cardHeight ?? 1589) ? (
          <div
            aria-hidden
            className="pointer-events-none absolute"
            style={{
              left: 0,
              right: 0,
              bottom: 0,
              height: '120px',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.92) 72%, rgba(255,255,255,1) 100%)',
              zIndex: 2,
              borderBottomLeftRadius: '8px',
              borderBottomRightRadius: '8px',
            }}
          />
        ) : null}

        <div
          className="scrollbar-hide"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '898px',
              height: `${contentHeight ?? cardHeight ?? 1589}px`,
            }}
          >
            <DetailHeader moduleKey={moduleKey} listing={listing} onClose={onClose} />
            <HeroImage
              listing={listing}
              onSee360={() => setThreshold360Open(true)}
              eventMetaOverlay={eventMetaOnHero ? eventMeta : undefined}
              phoneOverlay={eventMetaOnHero ? listing.phone : undefined}
            />
            <ActionRow
              listing={listing}
              eventMeta={eventMetaOnHero ? undefined : eventMeta}
              secondaryCta={secondaryCta}
            />
            <SharingRow
              slug={listing.slug}
              onEmailClick={openEmail}
              onPhoneClick={openPhone}
              favoritesKind={favoritesKind}
            />
            {mapSlot ? (
              <div
                className="absolute"
                style={{ left: 0, top: '844px', width: '899px', height: '384px' }}
              >
                {mapSlot}
              </div>
            ) : (
              <MapSection
                listing={listing}
                token={mapboxToken}
                onGetDirections={() => setDirectionsOpen(true)}
              />
            )}
            <DescriptionSection listing={listing} />
            {extraDetails ? (
              <div
                className="absolute"
                style={{
                  left: '48px',
                  top: '1470px',
                  width: '802px',
                  paddingTop: '16px',
                  borderTop: '1px solid #e8e8e8',
                }}
              >
                {extraDetails}
              </div>
            ) : null}
            {null}
            {stickyBuyCta ? null : null}
          </div>
        </div>
      </div>

      {/* Modales */}
      <SendToEmailModal
        open={emailOpen}
        listingTitle={listing.title}
        onCancel={() => setEmailOpen(false)}
        onSent={handleEmailSent}
      />
      <SendToPhoneModal
        open={phoneOpen}
        listingTitle={listing.title}
        onCancel={() => setPhoneOpen(false)}
        onSent={handlePhoneSent}
        onSwitchToKeyboard={() => {
          setPhoneOpen(false);
          openEmail();
        }}
      />
      <DirectionsModal
        open={directionsOpen}
        listing={listing}
        clientCoords={effectiveClientCoords}
        mapboxToken={mapboxToken}
        onClose={() => setDirectionsOpen(false)}
        onSendEmail={() => {
          setDirectionsOpen(false);
          openEmail();
        }}
        onSendPhone={() => {
          setDirectionsOpen(false);
          openPhone();
        }}
      />
      <Threshold360Modal
        open={threshold360Open}
        url={listing.threshold360Url}
        title={listing.title}
        onClose={() => setThreshold360Open(false)}
      />
      <SendConfirmationPopup
        open={confirm !== null}
        kind={confirm?.kind ?? 'email'}
        destination={confirm?.destination ?? ''}
        onClose={() => setConfirm(null)}
      />

      {/* Toast global (duplicado del módulo para que aparezca encima del detail) */}
      <FavoriteAddedToast />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Header azul con SUBCATEGORY + TITLE + X                                    */
/* -------------------------------------------------------------------------- */
function DetailHeader({
  moduleKey,
  listing,
  onClose,
}: {
  moduleKey: string;
  listing: Listing;
  onClose?: () => void;
}) {
  const subcategoryLabel = useSubcategoryLabel(listing.subcategory);
  return (
    <>
      {/* Fondo azul 899×312 */}
      <div
        aria-hidden
        className="absolute"
        style={{
          left: 0,
          top: 0,
          width: '899px',
          height: '312px',
          backgroundColor: 'hsl(var(--brand-primary))',
        }}
      />

      {/* SUBCATEGORY @ (48, 48), Helvetica 24, white, baseline y=18 */}
      <span
        className="absolute font-sans uppercase text-white"
        style={{
          left: '48px',
          top: '48px',
          maxWidth: '720px',
          fontSize: '24px',
          lineHeight: '24px',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block',
        }}
      >
        {subcategoryLabel}
      </span>

      {/* TITLE @ (48, 81), Helvetica 60, white, baseline y=46.
          Truncado a 1 línea con ellipsis si excede el ancho disponible. */}
      <span
        className="absolute text-white"
        style={{
          left: '48px',
          top: '81px',
          maxWidth: '720px',
          fontSize: '60px',
          lineHeight: '60px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'block',
        }}
      >
        {listing.title}
      </span>

      {/* Close X button — reemplaza Font Awesome `` por SVG simple blanco.
          Si se provee `onClose`, se usa esa callback (para overlays in-place);
          si no, navega al módulo origen. */}
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle"
          className="absolute flex items-center justify-center rounded-full text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{ left: '804px', top: '31px', width: '70px', height: '70px' }}
        >
          <svg width="42" height="42" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="11" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M8 8l8 8M16 8l-8 8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      ) : (
        <Link
          href={`/home/${moduleKey}`}
          aria-label="Cerrar detalle"
          className="absolute flex items-center justify-center rounded-full text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
          style={{ left: '804px', top: '31px', width: '70px', height: '70px' }}
        >
          <svg width="42" height="42" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="12" r="11" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M8 8l8 8M16 8l-8 8" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </Link>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Hero image 899×369 @ y=190                                                  */
/* -------------------------------------------------------------------------- */
function HeroImage({
  listing,
  onSee360,
  eventMetaOverlay,
  phoneOverlay,
}: {
  listing: Listing;
  onSee360: () => void;
  eventMetaOverlay?: EventMeta;
  phoneOverlay?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: 0,
        top: '190px',
        width: '899px',
        height: '369px',
      }}
    >
      {failed ? (
        <div
          aria-hidden
          className="h-full w-full"
          style={{
            background:
              'linear-gradient(135deg, hsl(var(--brand-primary)) 0%, hsl(var(--brand-secondary)) 100%)',
          }}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={listing.image}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      )}

      {listing.threshold360Url && <See360Badge onClick={onSee360} />}
      {eventMetaOverlay ? (
        <>
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0"
            style={{
              height: '310px',
              background:
                'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.92) 100%)',
            }}
          />
          <div
            className="absolute"
            style={{
              left: '36px',
              right: '36px',
              bottom: '22px',
              color: '#ffffff',
              fontFamily: 'Helvetica, Arial, sans-serif',
            }}
          >
            <div
              style={{
                fontSize: '30px',
                lineHeight: '34px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                textShadow: '0 2px 6px rgba(0,0,0,0.6)',
              }}
            >
              {eventMetaOverlay.dateLabel}
              {' | '}
              {eventMetaOverlay.timeLabel}
            </div>
            {phoneOverlay ? (
              <div
                style={{
                  marginTop: '14px',
                  fontSize: '30px',
                  lineHeight: '34px',
                  fontWeight: 700,
                  opacity: 0.95,
                  textShadow: '0 2px 6px rgba(0,0,0,0.6)',
                }}
              >
                {phoneOverlay}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function See360Badge({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Ver tour 360°"
      className="absolute flex items-center gap-3 rounded-full focus:outline-none focus-visible:ring-4 focus-visible:ring-white/60"
      style={{
        left: '30px',
        top: '278px',
        width: '254px',
        height: '61px',
        paddingLeft: '20px',
        backgroundColor: 'rgba(40,39,36,0.547)',
      }}
    >
      <svg width="46" height="34" viewBox="0 0 46 34" aria-hidden>
        <path
          d="M34.3 14.4c2.9 2 4.5 4.4 4.5 6.9 0 5.4-7.1 9.6-18 10.9v2.4L18.9 31l3.9-3.9v2.2c9.5-1.2 15.6-4.8 15.6-8.9 0-2-1.8-3.6-3.2-4.5z"
          fill="#fff"
        />
        <path
          d="M16.8 14.3c-1.4.9-3.2 2.5-3.2 4.5 0 3 3.5 6 9 7.8l-1.3-2.6c-3.9-1.3-5.9-3.2-5.9-5.2 0-1.2 1-2.4 2.8-3.4z"
          fill="#fff"
        />
        <circle cx="36" cy="6" r="4.4" fill="none" stroke="#fff" strokeWidth="2.5" />
        <ellipse cx="28" cy="10" rx="4.5" ry="5.5" fill="none" stroke="#fff" strokeWidth="2" />
        <circle cx="36" cy="16" r="1" fill="#fff" />
      </svg>
      <span
        className="text-white"
        style={{
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 700,
          fontSize: '38px',
          lineHeight: '38px',
          letterSpacing: '0.02em',
        }}
      >
        SEE 360
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Action row: Time/phone | WEBSITE | RESERVE NOW                              */
/* -------------------------------------------------------------------------- */
function ActionRow({
  listing,
  eventMeta,
  secondaryCta,
}: {
  listing: Listing;
  eventMeta?: EventMeta;
  secondaryCta?: SecondaryCta;
}) {
  const t = useTextos();
  // Orden de precedencia en el slot "segundo botón":
  //   1) listing.reserveUrl  → RESERVE NOW (OpenTable-ish)
  //   2) secondaryCta        → botón configurable (GET TICKETS)
  //   3) nada                → solo WEBSITE, centrado vertical
  const hasReserve = Boolean(listing.reserveUrl);
  const hasSecondary = !hasReserve && Boolean(secondaryCta);
  const twoButtons = hasReserve || hasSecondary;
  const hideMetaCol = !eventMeta && !listing.hours;
  const websiteTop = hideMetaCol ? 632 : twoButtons ? 581 : 624;
  const websiteLeft = 609;

  const hideMetaColumn = hideMetaCol;
  const primaryText = eventMeta
    ? `${eventMeta.dateLabel ?? eventMeta.date}  |  ${
        eventMeta.timeLabel ?? `${eventMeta.startTime} – ${eventMeta.endTime}`
      }`
    : `${listing.hours}  |  ${listing.phone}`;
  const secondaryText = eventMeta ? listing.phone : null;

  return (
    <>
      {/* Time / phone — centrado vertical con el botón WEBSITE. Oculto si Tickets
          renderea el eventMeta en el hero (hideMetaColumn = true). */}
      {hideMetaColumn ? null : (
        <div
          className="absolute flex flex-col justify-center"
          style={{
            left: '59px',
            top: `${websiteTop}px`,
            height: '64px',
            fontFamily: 'Helvetica, Arial, sans-serif',
            color: '#000',
            whiteSpace: 'pre',
            rowGap: '12px',
          }}
        >
          <span style={{ fontSize: '22px', lineHeight: '22px', fontWeight: 500 }}>
            {primaryText}
          </span>
          {secondaryText ? (
            <span
              style={{
                fontSize: '22px',
                lineHeight: '22px',
                fontWeight: 500,
                color: '#4a4a4a',
              }}
            >
              {secondaryText}
            </span>
          ) : null}
        </div>
      )}

      {/* WEBSITE button 260×64 */}
      <a
        href={listing.website}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
        style={{
          left: `${websiteLeft}px`,
          top: `${websiteTop}px`,
          width: '260px',
          height: '64px',
          borderRadius: '8px',
          backgroundColor: 'hsl(var(--brand-secondary))',
          fontFamily: 'Tahoma, Verdana, sans-serif',
          fontSize: '24px',
          lineHeight: '24px',
          color: '#fff',
          letterSpacing: '0.02em',
        }}
      >
        {t('listing_action_website') === 'listing_action_website'
          ? 'WEBSITE'
          : t('listing_action_website')}
      </a>

      {/* Segundo botón: RESERVE NOW o CTA configurable (GET TICKETS). */}
      {hasReserve && listing.reserveUrl ? <ReserveNowButton href={listing.reserveUrl} /> : null}
      {hasSecondary && secondaryCta ? (
        <SecondaryCtaButton
          cta={secondaryCta}
          leftOverride={hideMetaCol ? 59 : undefined}
          topOverride={hideMetaCol ? 632 : undefined}
        />
      ) : null}
    </>
  );
}

function SecondaryCtaButton({
  cta,
  leftOverride,
  topOverride,
}: {
  cta: SecondaryCta;
  leftOverride?: number;
  topOverride?: number;
}) {
  const t = useTextos();
  const resolvedLabel = cta.labelKey ? t(cta.labelKey) : cta.label;
  const label = cta.labelKey && resolvedLabel === cta.labelKey ? cta.label : resolvedLabel;
  const color = cta.color ?? 'blue';
  const bg = color === 'olive' ? 'hsl(var(--brand-tertiary))' : 'hsl(var(--brand-secondary))';
  const isOutlineRed = color === 'outline-red';
  const sharedStyle = {
    left: `${leftOverride ?? 609}px`,
    top: `${topOverride ?? 665}px`,
    width: '260px',
    height: '64px',
    borderRadius: '8px',
    backgroundColor: isOutlineRed ? '#fff' : bg,
    border: isOutlineRed ? '3px solid #db323a' : 'none',
    fontFamily: 'Tahoma, Verdana, sans-serif',
    fontSize: '20px',
    lineHeight: '20px',
    color: isOutlineRed ? '#db323a' : '#fff',
    fontWeight: 600,
    letterSpacing: '0.02em',
  } as const;
  const className =
    'absolute flex items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300';

  if (cta.onClick) {
    return (
      <button type="button" onClick={cta.onClick} className={className} style={sharedStyle}>
        {label}
      </button>
    );
  }
  return (
    <a
      href={cta.href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={sharedStyle}
    >
      {label}
    </a>
  );
}

function ReserveNowButton({ href }: { href: string }) {
  const t = useTextos();
  const label =
    t('listing_reserve_now') === 'listing_reserve_now' ? 'RESERVE NOW' : t('listing_reserve_now');
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute flex items-center justify-start focus:outline-none focus-visible:ring-4 focus-visible:ring-red-300"
      style={{
        left: '609px',
        top: '665px',
        width: '260px',
        height: '64px',
        borderRadius: '8px',
        backgroundColor: '#fff',
        border: '3px solid #db323a',
        paddingLeft: '17px',
        gap: '14px',
      }}
      aria-label={label}
    >
      {/* Logo OpenTable: 3 círculos en cascada #da3743 */}
      <svg width="38" height="16" viewBox="0 0 38 16" aria-hidden>
        <circle cx="19" cy="8" r="7.5" fill="none" stroke="#da3743" strokeWidth="2" />
        <circle cx="2.7" cy="8" r="2.7" fill="#da3743" />
        <circle cx="35.3" cy="8" r="2.7" fill="#da3743" />
      </svg>
      <span
        style={{
          fontFamily: 'Tahoma, Verdana, sans-serif',
          fontSize: '20px',
          lineHeight: '20px',
          color: '#db323a',
          letterSpacing: '0.02em',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
    </a>
  );
}

/* -------------------------------------------------------------------------- */
/* Sharing row (EMAIL | PHONE | FAVORITES) @ y=753, alto 90                   */
/* -------------------------------------------------------------------------- */
function SharingRow({
  slug,
  onEmailClick,
  onPhoneClick,
  favoritesKind,
}: {
  slug: string;
  onEmailClick: () => void;
  onPhoneClick: () => void;
  favoritesKind: 'listing' | 'event' | 'trail';
}) {
  const t = useTextos();
  const orFallback = (key: string, fallback: string) => {
    const v = t(key);
    return v === key ? fallback : v;
  };
  // Llamamos los TRES hooks siempre (reglas de React hooks). Todos son stores
  // externos ligeros (useSyncExternalStore). Escogemos el que corresponde.
  const listingStore = useFavorites();
  const eventStore = useEventFavorites();
  const trailStore = useTrailFavorites();
  const { isFavorited, toggle } =
    favoritesKind === 'event' ? eventStore : favoritesKind === 'trail' ? trailStore : listingStore;
  const favorited = isFavorited(slug);

  return (
    <div
      className="absolute"
      style={{
        left: '1px',
        top: '753px',
        width: '897px',
        height: '90px',
        borderTop: '1px solid #e0e0e0',
        borderBottom: '1px solid #e0e0e0',
      }}
    >
      {/* Dividers verticales @ x=298.25 y x=596.5 (card-relative 299.5, 597.5) */}
      <div
        aria-hidden
        className="absolute"
        style={{ left: '299px', top: 0, width: '1px', height: '90px', backgroundColor: '#e0e0e0' }}
      />
      <div
        aria-hidden
        className="absolute"
        style={{ left: '597px', top: 0, width: '1px', height: '90px', backgroundColor: '#e0e0e0' }}
      />

      {/* Cell 1: SEND TO EMAIL (x: 0..298) */}
      <ShareCell
        left={0}
        width={298}
        label={orFallback('share_send_email', 'SEND TO EMAIL')}
        ariaLabel={orFallback('share_send_email_aria', 'Send to email')}
        icon={<EnvelopeIcon />}
        onClick={onEmailClick}
      />

      {/* Cell 2: SEND TO PHONE (x: 299..596) */}
      <ShareCell
        left={299}
        width={298}
        label={orFallback('share_send_phone', 'SEND TO PHONE')}
        ariaLabel={orFallback('share_send_phone_aria', 'Send to phone')}
        icon={<PhoneIcon />}
        onClick={onPhoneClick}
      />

      {/* Cell 3: ADD / ADDED TO FAVORITES (x: 597..897) */}
      <ShareCell
        left={597}
        width={300}
        label={
          favorited
            ? orFallback('share_added_favorites', 'ADDED TO FAVORITES')
            : orFallback('share_add_favorites', 'ADD TO FAVORITES')
        }
        ariaLabel={favorited ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        ariaPressed={favorited}
        icon={<HeartIcon filled={favorited} />}
        onClick={() => toggle(slug)}
      />
    </div>
  );
}

function ShareCell({
  left,
  width,
  label,
  ariaLabel,
  ariaPressed,
  icon,
  onClick,
}: {
  left: number;
  width: number;
  label: string;
  ariaLabel: string;
  ariaPressed?: boolean;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      onClick={onClick}
      className="absolute flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-300"
      style={{ left: `${left}px`, top: 0, width: `${width}px`, height: '90px', gap: '14px' }}
    >
      <span
        className="inline-flex items-center justify-center"
        style={{ width: '40px', height: '40px' }}
      >
        {icon}
      </span>
      <span
        style={{
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '18px',
          lineHeight: '18px',
          fontWeight: 700,
          color: 'rgba(0,0,0,0.57)',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
    </button>
  );
}

function EnvelopeIcon() {
  // Paths verbatim del SVG (Mask-8), fill olive hsl(var(--brand-tertiary)).
  return (
    <svg width="39" height="29" viewBox="0 0 39 29" aria-hidden>
      <path
        d="M35.344,29H3.656a3.554,3.554,0,0,1-2.589-1.058A3.5,3.5,0,0,1,0,25.375V9.968a.416.416,0,0,1,.266-.415.569.569,0,0,1,.222-.053.489.489,0,0,1,.273.086c1.671,1.254,5.618,4.126,11.731,8.534l.762.68a30.517,30.517,0,0,0,2.894,1.964,7.216,7.216,0,0,0,3.352.982,6.841,6.841,0,0,0,3.352-1.058,21.456,21.456,0,0,0,2.894-1.964l.761-.6c5.963-4.259,9.91-7.13,11.731-8.534a.409.409,0,0,1,.288-.136.42.42,0,0,1,.207.06A.491.491,0,0,1,39,9.968V25.375a3.5,3.5,0,0,1-1.067,2.568A3.551,3.551,0,0,1,35.344,29ZM19.5,19.333a4.912,4.912,0,0,1-2.438-.905A18.212,18.212,0,0,1,14.7,16.765l-.762-.528C7.721,11.725,3.441,8.575,1.219,6.872L.686,6.494A1.721,1.721,0,0,1,0,5.06V3.625A3.5,3.5,0,0,1,1.067,1.058,3.557,3.557,0,0,1,3.656,0H35.344a3.554,3.554,0,0,1,2.589,1.058A3.5,3.5,0,0,1,39,3.625V5.06a1.722,1.722,0,0,1-.685,1.435l-.382.3c-2.166,1.7-6.5,4.874-12.873,9.44l-.761.528a18.232,18.232,0,0,1-2.362,1.662A4.911,4.911,0,0,1,19.5,19.333Z"
        fill="hsl(var(--brand-tertiary))"
      />
    </svg>
  );
}

function PhoneIcon() {
  // Paths verbatim del SVG (Mask-7), fill olive hsl(var(--brand-tertiary)).
  return (
    <svg width="25" height="40" viewBox="0 0 25 40" aria-hidden>
      <path
        d="M21.25,40H3.75a3.632,3.632,0,0,1-2.657-1.094A3.632,3.632,0,0,1,0,36.251V3.75A3.633,3.633,0,0,1,1.093,1.094,3.632,3.632,0,0,1,3.75,0h17.5a3.631,3.631,0,0,1,2.656,1.094A3.63,3.63,0,0,1,25,3.75v32.5A3.735,3.735,0,0,1,21.25,40ZM12.5,32a2.534,2.534,0,1,0,1.758.742A2.412,2.412,0,0,0,12.5,32ZM4.018,4a1.038,1.038,0,0,0-.721.271.862.862,0,0,0-.3.658V29.072a.859.859,0,0,0,.3.657A1.035,1.035,0,0,0,4.018,30H20.982a1.036,1.036,0,0,0,.722-.271.861.861,0,0,0,.3-.657V4.928a.864.864,0,0,0-.3-.658A1.039,1.039,0,0,0,20.982,4Z"
        fill="hsl(var(--brand-tertiary))"
      />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  // Outline (SVG Detail) vs Solid (SVG Favorite) — mismo path, distinto fill/stroke.
  return (
    <svg
      width="36"
      height="32"
      viewBox="0 0 24 24"
      fill={filled ? 'hsl(var(--brand-tertiary))' : 'none'}
      stroke="hsl(var(--brand-tertiary))"
      strokeWidth={filled ? 0 : 2}
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Map section @ (0, 844) size 899×312                                         */
/* -------------------------------------------------------------------------- */
function MapSection({
  listing,
  token,
  onGetDirections,
}: {
  listing: Listing;
  token: string | undefined;
  onGetDirections: () => void;
}) {
  const t = useTextos();
  const directionsLabel =
    t('listing_get_directions') === 'listing_get_directions'
      ? 'GET DIRECTIONS'
      : t('listing_get_directions');
  return (
    <>
      <div
        className="absolute overflow-hidden"
        style={{ left: 0, top: '844px', width: '899px', height: '312px' }}
      >
        <MapboxMap
          token={token}
          coords={listing.coords}
          className="h-full w-full"
          ariaLabel={`Mapa de ${listing.title}`}
        />
      </div>

      {/* Divider horizontal @ y=1151, width 894, left 2 */}
      <div
        aria-hidden
        className="absolute"
        style={{
          left: '2px',
          top: '1151px',
          width: '894px',
          height: '1px',
          backgroundColor: '#e0e0e0',
        }}
      />

      {/* Address text @ (36, 1216) Helvetica 24 rgba(74,74,74,0.9) */}
      <span
        className="absolute"
        style={{
          left: '36px',
          top: '1196px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '24px',
          lineHeight: '24px',
          color: 'rgba(74,74,74,0.9)',
        }}
      >
        {listing.address}
      </span>

      {/* GET DIRECTIONS (icon + texto) */}
      <button
        type="button"
        aria-label={`${directionsLabel}: ${listing.title}`}
        onClick={onGetDirections}
        className="absolute flex items-center gap-3 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
        style={{
          left: '634px',
          top: '1184px',
          height: '44px',
        }}
      >
        <DirectionsIcon />
        <span
          style={{
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontWeight: 700,
            fontSize: '18px',
            lineHeight: '18px',
            color: '#6e6e6e',
            letterSpacing: '0.02em',
          }}
        >
          {directionsLabel}
        </span>
      </button>
    </>
  );
}

function DirectionsIcon() {
  // Paths verbatim del SVG original (map-3 group: Path_179, 180, 181, 182)
  // con sus transforms anidados tal cual. Pin drop con flag a la derecha, fill hsl(var(--brand-primary)).
  return (
    <svg width="46" height="36" viewBox="0 0 46 36" aria-hidden>
      <g transform="translate(8.498, 26.109)">
        <path
          transform="translate(-60.814, -373.412)"
          d="M87.3,381l-14.08-7.455a1.129,1.129,0,0,0-1.161.067L61.3,381.064a1.119,1.119,0,0,0,.635,2.038H86.777A1.119,1.119,0,0,0,87.3,381Z"
          fill="hsl(var(--brand-primary))"
        />
      </g>
      <g transform="translate(23.409, 15.784)">
        <path
          transform="translate(-274.069, -225.744)"
          d="M290.36,241.527l-3.311-14.908a1.12,1.12,0,0,0-1.73-.678L274.55,233.4a1.118,1.118,0,0,0,.114,1.906l14.078,7.455a1.122,1.122,0,0,0,.524.132,1.1,1.1,0,0,0,.678-.23A1.12,1.12,0,0,0,290.36,241.527Z"
          fill="hsl(var(--brand-primary))"
        />
      </g>
      <g transform="translate(5.28, 13.425)">
        <path
          transform="translate(-14.784, -192)"
          d="M41.413,192.785A1.121,1.121,0,0,0,40.344,192H30.132a46.7,46.7,0,0,1-5.734,7.835,3.355,3.355,0,0,1-4.994,0c-.436-.486-1.112-1.262-1.886-2.224L14.81,209.8a1.118,1.118,0,0,0,1.092,1.36,1.108,1.108,0,0,0,.638-.2l24.439-16.922A1.115,1.115,0,0,0,41.413,192.785Z"
          fill="hsl(var(--brand-primary))"
        />
      </g>
      <g transform="translate(4.565, 0)">
        <path
          transform="translate(-4.565, 0)"
          d="M12.4,0A7.84,7.84,0,0,0,4.565,7.831c0,4.018,6.283,11.136,7,11.934a1.118,1.118,0,0,0,1.665,0c.716-.8,7-7.916,7-11.934A7.84,7.84,0,0,0,12.4,0Zm0,11.187a3.356,3.356,0,1,1,3.356-3.356A3.357,3.357,0,0,1,12.4,11.187Z"
          fill="hsl(var(--brand-primary))"
        />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Description section                                                          */
/* -------------------------------------------------------------------------- */
function DescriptionSection({ listing }: { listing: Listing }) {
  return (
    <>
      <span
        className="absolute"
        style={{
          left: '48px',
          top: '1289px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 700,
          fontSize: '24px',
          lineHeight: '24px',
          color: '#444',
          opacity: 0.85,
          letterSpacing: '0.02em',
        }}
      >
        DESCRIPTION
      </span>
      <p
        className="absolute whitespace-pre-line"
        style={{
          left: '48px',
          top: '1341px',
          width: '802px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: '18px',
          lineHeight: '26px',
          color: '#898989',
        }}
      >
        {listing.description}
      </p>
    </>
  );
}
