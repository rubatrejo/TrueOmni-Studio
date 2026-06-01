import type {
  HeroPrimaryAction,
  ListingDetail,
  ListingDetailTexts,
} from '@/components/pwa/listings-detail-screen';
import type { KioskConfig, PwaConfig, PwaListingsModuleConfig } from '@/lib/config';
import { isListingsModule } from '@/lib/itinerary-tabs';

export interface PwaListingDetailData {
  detail: ListingDetail;
  texts: ListingDetailTexts;
  heroPrimaryAction: HeroPrimaryAction;
}

/** `home.modules` usa "things-to-do"; `features.pwa` usa "thingsToDo". */
const PWA_KEY: Record<string, keyof PwaConfig> = {
  restaurants: 'restaurants',
  stay: 'stay',
  'things-to-do': 'thingsToDo',
};

/**
 * Construye `{ detail, texts, heroPrimaryAction }` de un listing de un módulo dado,
 * reutilizando la misma lógica que los detail pages de cada módulo. Usado por el
 * detalle del módulo Maps (`/pwa/map/[module]/[slug]`) para no duplicar el armado.
 * Devuelve `null` si el módulo/slug no existe o no es un módulo de listings.
 *
 * La acción del hero depende del módulo: restaurants → popup de menú; stay → "BOOK
 * NOW" externo; el resto → sin botón. Al sumar Events/Trails, ampliar este switch.
 */
export function buildPwaListingDetail(
  config: KioskConfig,
  moduleSlug: string,
  slug: string,
): PwaListingDetailData | null {
  const mod = config.features?.home?.modules?.[moduleSlug];
  const pwaKey = PWA_KEY[moduleSlug];
  const cfg = pwaKey
    ? (config.features?.pwa?.[pwaKey] as PwaListingsModuleConfig | undefined)
    : undefined;
  if (!mod || !cfg || !isListingsModule(mod)) return null;

  const l = mod.listings.find((x) => x.slug === slug);
  if (!l) return null;

  const detail: ListingDetail = {
    slug: l.slug,
    title: l.title,
    image: l.image,
    address: l.address,
    phone: l.phone,
    website: l.website,
    description: l.description,
    coords: l.coords,
    openHours: l.openHours,
    diningGuideUrl: l.diningGuideUrl,
    gallery: l.gallery,
  };

  const texts: ListingDetailTexts = {
    headerTitle: cfg.title,
    eyebrow: cfg.detail.eyebrow,
    call: cfg.detail.call,
    website: cfg.detail.website,
    addFavorite: cfg.detail.addFavorite,
    removeFavorite: cfg.detail.removeFavorite,
    seeDirections: cfg.detail.seeDirections,
    description: cfg.detail.description,
    openNowUntil: cfg.detail.openNowUntil,
    moreHours: cfg.detail.moreHours,
    openDiningGuide: cfg.detail.openDiningGuide,
    businessHours: cfg.businessHours,
  };

  let heroPrimaryAction: HeroPrimaryAction = { kind: 'none' };
  if (moduleSlug === 'restaurants' && l.menuImage && cfg.detail.menu && cfg.menu) {
    heroPrimaryAction = {
      kind: 'image-popup',
      label: cfg.detail.menu,
      image: l.menuImage,
      closeLabel: cfg.menu.close,
    };
  } else if (moduleSlug === 'stay') {
    const bookUrl = l.reserveUrl ?? l.website;
    if (bookUrl && cfg.detail.bookNow) {
      heroPrimaryAction = { kind: 'external-link', label: cfg.detail.bookNow, url: bookUrl };
    }
  }

  return { detail, texts, heroPrimaryAction };
}
