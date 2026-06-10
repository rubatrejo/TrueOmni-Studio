import { describe, expect, it } from 'vitest';

import { PwaConfigSchema } from './pwa-schema';

/**
 * Tests del schema Zod del slice PWA (F-PWA-6 / F-QA-6). Verifica la estrategia
 * permisiva: valida la forma de los 5 slices clave sin rechazar configs con
 * campos extra, y rechaza formas inválidas.
 */
describe('PwaConfigSchema', () => {
  it('acepta un slice válido mínimo (scavenger + wayfinding)', () => {
    const r = PwaConfigSchema.safeParse({
      scavengerHunt: {
        hunts: [
          {
            slug: 'h1',
            name: 'Hunt',
            tasks: [
              {
                slug: 't1',
                type: 'checkin',
                name: 'T',
                coords: { lat: 33.4, lng: -112 },
                checkinRadius: 50,
              },
            ],
          },
        ],
      },
      wayfinding: {
        floors: [{ key: 'f1', label: 'Floor 1', origin: { x: 50, y: 50 }, amenities: [] }],
      },
    });
    expect(r.success).toBe(true);
  });

  it('aplica defaults: tasks ausentes → []', () => {
    const r = PwaConfigSchema.safeParse({
      scavengerHunt: { hunts: [{ slug: 'h1', name: 'Hunt' }] },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.scavengerHunt?.hunts?.[0]?.tasks).toEqual([]);
    }
  });

  it('preserva campos desconocidos (passthrough, no rompe configs existentes)', () => {
    const r = PwaConfigSchema.safeParse({
      welcome: { title: 'Hi', somethingNew: 42 },
      scavengerHunt: { hunts: [], extraGroup: { foo: 'bar' } },
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect((r.data as Record<string, unknown>).welcome).toMatchObject({ somethingNew: 42 });
    }
  });

  it('rechaza hunts que no son array', () => {
    const r = PwaConfigSchema.safeParse({ scavengerHunt: { hunts: 'nope' } });
    expect(r.success).toBe(false);
  });

  it('rechaza un task.type inválido', () => {
    const r = PwaConfigSchema.safeParse({
      scavengerHunt: {
        hunts: [
          {
            slug: 'h',
            name: 'H',
            tasks: [{ slug: 't', type: 'bad', name: 'T', coords: { lat: 0, lng: 0 } }],
          },
        ],
      },
    });
    expect(r.success).toBe(false);
  });

  it('rechaza coords no numéricas', () => {
    const r = PwaConfigSchema.safeParse({
      scavengerHunt: {
        hunts: [
          {
            slug: 'h',
            name: 'H',
            tasks: [{ slug: 't', type: 'photo', name: 'T', coords: { lat: 'x', lng: 0 } }],
          },
        ],
      },
    });
    expect(r.success).toBe(false);
  });

  it('rechaza un floor sin key', () => {
    const r = PwaConfigSchema.safeParse({
      wayfinding: { floors: [{ label: 'F1', amenities: [] }] },
    });
    expect(r.success).toBe(false);
  });

  it('rechaza una URL de website mal formada en connectWithUs', () => {
    const r = PwaConfigSchema.safeParse({ connectWithUs: { website: 'not a url' } });
    expect(r.success).toBe(false);
  });

  it('acepta website vacío en connectWithUs (campo opcional limpiable)', () => {
    const r = PwaConfigSchema.safeParse({ connectWithUs: { website: '' } });
    expect(r.success).toBe(true);
  });
});
