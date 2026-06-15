import { afterEach, describe, expect, it } from 'vitest';

import { resolveSystemModuleHidden } from './system-modules-cache';

type WinShape = { __kioskSystemModulesOverride?: Record<string, boolean | undefined> };

function setCache(value: WinShape['__kioskSystemModulesOverride']) {
  (globalThis as unknown as { window?: WinShape }).window = {
    __kioskSystemModulesOverride: value,
  };
}

afterEach(() => {
  delete (globalThis as unknown as { window?: unknown }).window;
});

describe('resolveSystemModuleHidden', () => {
  it('sin window (SSR/runtime publicado): usa fallbackEnabled', () => {
    // window indefinido → no hay cache del Studio.
    expect(resolveSystemModuleHidden('aiAvatar', true)).toBe(false);
    expect(resolveSystemModuleHidden('aiAvatar', false)).toBe(true);
  });

  it('window sin override (runtime fuera del Studio): usa fallbackEnabled', () => {
    setCache(undefined);
    expect(resolveSystemModuleHidden('aiAvatar', true)).toBe(false);
    expect(resolveSystemModuleHidden('aiAvatar', false)).toBe(true);
  });

  it('preview con aiAvatar=false: hidden=true aunque fallbackEnabled sea true (regresión del FAB)', () => {
    setCache({ aiAvatar: false });
    expect(resolveSystemModuleHidden('aiAvatar', true)).toBe(true);
  });

  it('preview con aiAvatar=true: hidden=false', () => {
    setCache({ aiAvatar: true });
    expect(resolveSystemModuleHidden('aiAvatar', false)).toBe(false);
  });

  it('cache presente pero sin la key consultada: cae a fallbackEnabled', () => {
    setCache({ ads: false });
    expect(resolveSystemModuleHidden('aiAvatar', true)).toBe(false);
    expect(resolveSystemModuleHidden('languages', true)).toBe(false);
  });

  it('respeta cada key de forma independiente (ads/languages)', () => {
    setCache({ ads: false, languages: true, aiAvatar: false });
    expect(resolveSystemModuleHidden('ads', true)).toBe(true);
    expect(resolveSystemModuleHidden('languages', true)).toBe(false);
    expect(resolveSystemModuleHidden('aiAvatar', true)).toBe(true);
  });
});
