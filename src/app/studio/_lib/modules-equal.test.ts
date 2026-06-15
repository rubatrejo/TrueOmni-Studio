import { describe, expect, it } from 'vitest';

import { defaultModules, type ModulesConfig } from '@/lib/studio/schema';

import { modulesEqual } from './modules-equal';

const clone = (m: ModulesConfig): ModulesConfig => JSON.parse(JSON.stringify(m)) as ModulesConfig;

describe('modulesEqual — dirty detection del Modules tab', () => {
  it('objetos idénticos → iguales (no dirty)', () => {
    expect(modulesEqual(defaultModules(), defaultModules())).toBe(true);
  });

  it('cambiar tileOverlayOpacity → distintos (regresión: antes no marcaba dirty)', () => {
    const a = defaultModules();
    const b = clone(a);
    b.tileOverlayOpacity = 80;
    expect(modulesEqual(a, b)).toBe(false);
  });

  it('cambiar tileTitleFontSize → distintos (regresión: antes no marcaba dirty)', () => {
    const a = defaultModules();
    const b = clone(a);
    b.tileTitleFontSize = 70;
    expect(modulesEqual(a, b)).toBe(false);
  });

  it('cambiar tile.wide → distintos (regresión)', () => {
    const a = defaultModules();
    const b = clone(a);
    b.tiles[0] = { ...b.tiles[0], wide: !b.tiles[0].wide };
    expect(modulesEqual(a, b)).toBe(false);
  });

  it('cambiar tile.image → distintos (regresión)', () => {
    const a = defaultModules();
    const b = clone(a);
    b.tiles[0] = { ...b.tiles[0], image: '/assets/home/tiles/nuevo.jpg' };
    expect(modulesEqual(a, b)).toBe(false);
  });

  it('cambiar iconOverrides → distintos (regresión)', () => {
    const a = defaultModules();
    const b = clone(a);
    b.iconOverrides = { ...b.iconOverrides, events: 'Star' };
    expect(modulesEqual(a, b)).toBe(false);
  });

  it('cambiar label/enabled de un tile → distintos (ya funcionaba)', () => {
    const a = defaultModules();
    const b = clone(a);
    b.tiles[0] = { ...b.tiles[0], label: 'Otro', enabled: !b.tiles[0].enabled };
    expect(modulesEqual(a, b)).toBe(false);
  });
});
