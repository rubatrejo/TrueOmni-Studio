import { describe, expect, it } from 'vitest';

import {
  isPwaModuleInherited,
  isPwaModuleVisible,
  isPwaSharedModule,
  isPwaToggleableModule,
  resolvePwaVisibility,
} from './pwa-module-visibility';

describe('pwa-module-visibility', () => {
  describe('isPwaModuleVisible — herencia del Kiosk (módulos compartidos)', () => {
    it('hereda OFF del Kiosk cuando no hay override PWA', () => {
      expect(
        isPwaModuleVisible('events', {
          kioskSystemModules: { events: false },
          pwaModuleVisibility: null,
        }),
      ).toBe(false);
    });

    it('hereda ON del Kiosk cuando no hay override PWA', () => {
      expect(
        isPwaModuleVisible('events', {
          kioskSystemModules: { events: true },
          pwaModuleVisibility: {},
        }),
      ).toBe(true);
    });

    it('mapea trip-planner → itineraryBuilder del Kiosk', () => {
      expect(
        isPwaModuleVisible('trip-planner', {
          kioskSystemModules: { itineraryBuilder: false },
          pwaModuleVisibility: null,
        }),
      ).toBe(false);
    });

    it('default ON si el Kiosk no define el campo', () => {
      expect(isPwaModuleVisible('map', { kioskSystemModules: {}, pwaModuleVisibility: null })).toBe(
        true,
      );
    });

    it('ai-avatar hereda OFF del Kiosk (systemModules.aiAvatar=false)', () => {
      expect(
        isPwaModuleVisible('ai-avatar', {
          kioskSystemModules: { aiAvatar: false },
          pwaModuleVisibility: null,
        }),
      ).toBe(false);
    });

    it('ai-avatar hereda ON del Kiosk', () => {
      expect(
        isPwaModuleVisible('ai-avatar', {
          kioskSystemModules: { aiAvatar: true },
          pwaModuleVisibility: {},
        }),
      ).toBe(true);
    });
  });

  describe('isPwaModuleVisible — override manual PWA gana sobre la herencia', () => {
    it('override ON aunque el Kiosk lo tenga OFF', () => {
      expect(
        isPwaModuleVisible('events', {
          kioskSystemModules: { events: false },
          pwaModuleVisibility: { events: true },
        }),
      ).toBe(true);
    });

    it('override OFF aunque el Kiosk lo tenga ON', () => {
      expect(
        isPwaModuleVisible('events', {
          kioskSystemModules: { events: true },
          pwaModuleVisibility: { events: false },
        }),
      ).toBe(false);
    });

    it('ai-avatar: override ON aunque el Kiosk lo tenga OFF', () => {
      expect(
        isPwaModuleVisible('ai-avatar', {
          kioskSystemModules: { aiAvatar: false },
          pwaModuleVisibility: { 'ai-avatar': true },
        }),
      ).toBe(true);
    });
  });

  describe('isPwaModuleVisible — módulos PWA-only (sin herencia)', () => {
    it('default ON sin override', () => {
      expect(
        isPwaModuleVisible('scavenger-hunt', { kioskSystemModules: {}, pwaModuleVisibility: null }),
      ).toBe(true);
    });

    it('respeta el override manual', () => {
      expect(
        isPwaModuleVisible('scavenger-hunt', {
          kioskSystemModules: {},
          pwaModuleVisibility: { 'scavenger-hunt': false },
        }),
      ).toBe(false);
    });
  });

  describe('isPwaModuleInherited — badge "Synced with Kiosk"', () => {
    it('compartido sin override = heredado', () => {
      expect(isPwaModuleInherited('events', {})).toBe(true);
      expect(isPwaModuleInherited('events', null)).toBe(true);
    });

    it('compartido con override = NO heredado (manual)', () => {
      expect(isPwaModuleInherited('events', { events: false })).toBe(false);
    });

    it('PWA-only nunca es heredado', () => {
      expect(isPwaModuleInherited('scavenger-hunt', {})).toBe(false);
    });
  });

  describe('clasificadores', () => {
    it('isPwaSharedModule', () => {
      expect(isPwaSharedModule('events')).toBe(true);
      expect(isPwaSharedModule('trip-planner')).toBe(true);
      expect(isPwaSharedModule('ai-avatar')).toBe(true);
      expect(isPwaSharedModule('scavenger-hunt')).toBe(false);
      expect(isPwaSharedModule('profile')).toBe(false);
    });

    it('isPwaToggleableModule', () => {
      expect(isPwaToggleableModule('events')).toBe(true);
      expect(isPwaToggleableModule('scavenger-hunt')).toBe(true);
      expect(isPwaToggleableModule('profile')).toBe(false);
      expect(isPwaToggleableModule('login')).toBe(false);
    });
  });

  describe('resolvePwaVisibility — mapa horneado al publicar', () => {
    it('resuelve todas las keys toggleables a booleanos explícitos', () => {
      const map = resolvePwaVisibility({
        kioskSystemModules: { events: false, itineraryBuilder: false },
        pwaModuleVisibility: { events: true }, // override re-activa events
      });
      expect(map.events).toBe(true); // override gana
      expect(map['trip-planner']).toBe(false); // hereda itineraryBuilder OFF
      expect(map.restaurants).toBe(true); // default ON
      expect(map['scavenger-hunt']).toBe(true); // pwa-only default ON
      // Todas las keys presentes y booleanas (horneado completo).
      expect(Object.values(map).every((v) => typeof v === 'boolean')).toBe(true);
    });
  });
});
