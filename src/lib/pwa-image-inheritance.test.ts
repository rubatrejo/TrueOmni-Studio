import { describe, expect, it } from 'vitest';

import type { KioskConfig, PwaConfig } from '@/lib/config';

import {
  pwaImageSourcesFromConfig,
  resolvePwaConfigImages,
  resolvePwaImages,
  type PwaImageSources,
} from './pwa-image-inheritance';

/** Construye un slice PWA mínimo con dashboard/welcome/login para los tests. */
function makePwa(overrides: Partial<PwaConfig> = {}): PwaConfig {
  return {
    dashboard: {
      heroTitle: 'Hi',
      heroImage: '',
      quickAccess: [{ key: 'regions', label: 'REGIONS', image: '' }],
      tiles: [
        { key: 'restaurants', label: 'Restaurants', image: '' },
        { key: 'events', label: 'Events', image: 'assets/pwa/own-events.jpg' },
      ],
    },
    welcome: { background: '' },
    login: {
      loginWith: '',
      emailPlaceholder: '',
      passwordPlaceholder: '',
      forgotPassword: '',
      loginCta: '',
      createAccountCta: '',
      skipLogin: '',
    },
    ...overrides,
  } as PwaConfig;
}

const SOURCES: PwaImageSources = {
  homeHero: 'assets/branding/home-hero.jpg',
  idleBackground: 'assets/branding/idle-bg.jpg',
  tileImages: {
    restaurants: 'assets/home/tiles/restaurants.jpg',
    events: 'assets/home/tiles/events.jpg',
    regions: 'assets/home/tiles/regions.jpg',
  },
};

describe('resolvePwaImages', () => {
  it('hereda hero, tile y quick-access vacíos del kiosk', () => {
    const out = resolvePwaImages(makePwa(), SOURCES);
    expect(out.dashboard?.heroImage).toBe('assets/branding/home-hero.jpg');
    expect(out.dashboard?.tiles[0].image).toBe('assets/home/tiles/restaurants.jpg');
    expect(out.dashboard?.quickAccess[0].image).toBe('assets/home/tiles/regions.jpg');
  });

  it('NO pisa los campos que la PWA ya tiene (override gana)', () => {
    const out = resolvePwaImages(makePwa(), SOURCES);
    expect(out.dashboard?.tiles[1].image).toBe('assets/pwa/own-events.jpg');
  });

  it('borrar la imagen de la PWA (vacío) revierte a heredar', () => {
    const pwa = makePwa();
    pwa.dashboard!.tiles[1].image = ''; // el operador borró su override de events
    const out = resolvePwaImages(pwa, SOURCES);
    expect(out.dashboard?.tiles[1].image).toBe('assets/home/tiles/events.jpg');
  });

  it('welcome background vacío hereda el idle background del kiosk', () => {
    const out = resolvePwaImages(makePwa(), SOURCES);
    expect(out.welcome?.background).toBe('assets/branding/idle-bg.jpg');
  });

  it('login background vacío hereda el welcome resuelto (idle del kiosk)', () => {
    const out = resolvePwaImages(makePwa(), SOURCES);
    expect(out.login?.background).toBe('assets/branding/idle-bg.jpg');
  });

  it('login usa el welcome propio de la PWA antes que el idle del kiosk', () => {
    const pwa = makePwa({ welcome: { background: 'assets/pwa/own-welcome.jpg' } });
    const out = resolvePwaImages(pwa, SOURCES);
    expect(out.welcome?.background).toBe('assets/pwa/own-welcome.jpg');
    expect(out.login?.background).toBe('assets/pwa/own-welcome.jpg');
  });

  it('sin fuentes del kiosk deja los campos como están (no rellena)', () => {
    const out = resolvePwaImages(makePwa(), {});
    expect(out.dashboard?.heroImage).toBe('');
    expect(out.dashboard?.tiles[0].image).toBe('');
    expect(out.welcome?.background).toBe('');
  });

  it('no muta el slice de origen', () => {
    const pwa = makePwa();
    const before = JSON.stringify(pwa);
    resolvePwaImages(pwa, SOURCES);
    expect(JSON.stringify(pwa)).toBe(before);
  });

  it('es seguro con dashboard/welcome/login ausentes', () => {
    const out = resolvePwaImages({} as PwaConfig, SOURCES);
    expect(out.dashboard).toBeUndefined();
    expect(out.welcome).toBeUndefined();
    expect(out.login).toBeUndefined();
  });

  it('hereda aunque el slice traiga los PLACEHOLDERS del seed (no son elección del operador)', () => {
    const pwa = makePwa({
      welcome: { background: 'assets/pwa/welcome-bg.jpg' },
      dashboard: {
        heroTitle: 'Hi',
        heroImage: 'assets/pwa/dashboard/hero.jpg',
        quickAccess: [
          { key: 'regions', label: 'REGIONS', image: 'assets/pwa/dashboard/quick-regions.jpg' },
        ],
        tiles: [
          { key: 'restaurants', label: 'Restaurants', image: 'assets/home/tiles/restaurants.jpg' },
        ],
      },
    });
    const out = resolvePwaImages(pwa, SOURCES);
    expect(out.welcome?.background).toBe('assets/branding/idle-bg.jpg');
    expect(out.login?.background).toBe('assets/branding/idle-bg.jpg');
    expect(out.dashboard?.heroImage).toBe('assets/branding/home-hero.jpg');
    expect(out.dashboard?.quickAccess[0].image).toBe('assets/home/tiles/regions.jpg');
    expect(out.dashboard?.tiles[0].image).toBe('assets/home/tiles/restaurants.jpg');
  });

  it('un upload real (URL http) NUNCA es placeholder: el override gana', () => {
    const pwa = makePwa({ welcome: { background: 'https://cdn.example.com/my-welcome.jpg' } });
    const out = resolvePwaImages(pwa, SOURCES);
    expect(out.welcome?.background).toBe('https://cdn.example.com/my-welcome.jpg');
  });
});

/** Config de runtime mínimo con las fuentes del kiosk para los tests. */
function makeConfig(overrides: Partial<KioskConfig> = {}): KioskConfig {
  return {
    branding: {
      logo: { default: 'assets/logo.svg', alt: 'Logo' },
      homeHero: { kind: 'image', src: 'assets/branding/home-hero.jpg' },
    },
    features: {
      billboard_background: { type: 'image', src: 'assets/billboard-0/hero.jpg' },
      home: {
        tiles: [
          { key: 'restaurants', label: 'Restaurants', image: 'assets/home/tiles/restaurants.jpg' },
          { key: 'events', label: 'Events', image: 'assets/home/tiles/events.jpg' },
        ],
        listings: [],
      },
      pwa: makePwa(),
    },
    ...overrides,
  } as unknown as KioskConfig;
}

describe('pwaImageSourcesFromConfig', () => {
  it('lee hero (branding.homeHero), idle (features.billboard_background) y tiles (features.home.tiles)', () => {
    const sources = pwaImageSourcesFromConfig(makeConfig());
    expect(sources.homeHero).toBe('assets/branding/home-hero.jpg');
    expect(sources.idleBackground).toBe('assets/billboard-0/hero.jpg');
    expect(sources.tileImages?.restaurants).toBe('assets/home/tiles/restaurants.jpg');
  });

  it('NO hereda el idle si el fondo del billboard es video', () => {
    const config = makeConfig({
      features: {
        billboard_background: { type: 'video', src: 'assets/billboard-0/hero.mp4' },
      },
    } as unknown as Partial<KioskConfig>);
    const sources = pwaImageSourcesFromConfig(config);
    expect(sources.idleBackground).toBeUndefined();
  });

  it('NO hereda el hero si branding.homeHero es video', () => {
    const config = makeConfig({
      branding: {
        logo: { default: 'assets/logo.svg', alt: 'Logo' },
        homeHero: { kind: 'video', src: 'assets/branding/home-hero.mp4' },
      },
    } as unknown as Partial<KioskConfig>);
    const sources = pwaImageSourcesFromConfig(config);
    expect(sources.homeHero).toBeUndefined();
  });
});

describe('resolvePwaConfigImages', () => {
  it('resuelve el slice PWA con las imágenes heredadas del config de runtime (live)', () => {
    const out = resolvePwaConfigImages(makeConfig());
    expect(out?.dashboard?.heroImage).toBe('assets/branding/home-hero.jpg');
    expect(out?.dashboard?.tiles[0].image).toBe('assets/home/tiles/restaurants.jpg');
    expect(out?.welcome?.background).toBe('assets/billboard-0/hero.jpg');
    expect(out?.login?.background).toBe('assets/billboard-0/hero.jpg');
  });

  it('respeta el override propio de la PWA (events tiene imagen propia)', () => {
    const out = resolvePwaConfigImages(makeConfig());
    expect(out?.dashboard?.tiles[1].image).toBe('assets/pwa/own-events.jpg');
  });

  it('devuelve undefined si no hay slice PWA', () => {
    const config = makeConfig({
      features: { home: { tiles: [], listings: [] } },
    } as unknown as Partial<KioskConfig>);
    expect(resolvePwaConfigImages(config)).toBeUndefined();
  });
});
