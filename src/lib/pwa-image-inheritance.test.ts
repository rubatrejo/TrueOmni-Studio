import { describe, expect, it } from 'vitest';

import type { PwaConfig } from '@/lib/config';

import { resolvePwaImages, type PwaImageSources } from './pwa-image-inheritance';

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
});
