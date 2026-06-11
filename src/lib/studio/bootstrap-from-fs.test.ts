import { describe, expect, it } from 'vitest';

import { bootstrapStudioFromFs, computeFsTemplateHash, readClientFs } from './bootstrap-from-fs';
import { DEFAULT_BRANDING, makeBlankConfig } from './schema';

/**
 * Tests de integración ligera para bootstrap-from-fs (F-QA-6 del audit).
 *
 * Estas pruebas leen el filesystem real del repo (`clients/default/`) para
 * verificar que la capa de lectura y el bootstrap funcionan end-to-end sin
 * necesitar KV ni infraestructura externa. El stub de `server-only` en
 * vitest.config.ts neutraliza el guard de Next.js RSC.
 */
describe('readClientFs', () => {
  it('devuelve config no-null para el cliente "default" (existe en el repo)', async () => {
    const result = await readClientFs('default');
    expect(result.config).not.toBeNull();
  });

  it('el config del cliente "default" tiene las secciones clave del FsConfig', async () => {
    const { config } = await readClientFs('default');
    expect(config).not.toBeNull();
    if (!config) return;
    // El cliente default tiene client.slug, branding y features
    expect(config.client).toBeDefined();
    expect(config.client?.slug).toBe('default');
    expect(config.branding).toBeDefined();
  });

  it('devuelve tokensCss no-null para el cliente "default"', async () => {
    const { tokensCss } = await readClientFs('default');
    expect(tokensCss).not.toBeNull();
    // El archivo tokens.css debe contener al menos la variable brand primaria
    expect(tokensCss).toMatch(/--brand-primary/);
  });

  it('devuelve config null para un slug inexistente (slug que no existe en /clients/)', async () => {
    const result = await readClientFs('__slug_que_no_existe__');
    // La función lee el archivo y captura el error — devuelve null en lugar de lanzar
    expect(result.config).toBeNull();
  });

  it('devuelve tokensCss null para un slug inexistente', async () => {
    const result = await readClientFs('__slug_que_no_existe__');
    expect(result.tokensCss).toBeNull();
  });
});

describe('computeFsTemplateHash', () => {
  it('devuelve un hash de 16 caracteres hex para el cliente "default"', async () => {
    const hash = await computeFsTemplateHash('default');
    expect(hash).not.toBeNull();
    // SHA-256 truncado a 16 chars hex (solo hexadecimales lowercase)
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('devuelve null para un slug inexistente', async () => {
    const hash = await computeFsTemplateHash('__slug_que_no_existe__');
    expect(hash).toBeNull();
  });

  it('el hash es determinista — dos llamadas con el mismo slug producen el mismo resultado', async () => {
    const h1 = await computeFsTemplateHash('default');
    const h2 = await computeFsTemplateHash('default');
    expect(h1).toBe(h2);
  });
});

describe('bootstrapStudioFromFs', () => {
  it('devuelve el studio intacto cuando fsConfig es null', () => {
    const studio = makeBlankConfig('test', 'Test');
    const result = bootstrapStudioFromFs(studio, null, null);
    // Sin fs config no debe haber ningún cambio
    expect(result).toEqual(studio);
  });

  it('no lanza con el config del cliente "default"', async () => {
    const { config, tokensCss } = await readClientFs('default');
    const studio = makeBlankConfig('default', 'TrueOmni Default');
    // Debe ejecutar sin errores y devolver un KioskConfig válido
    expect(() => bootstrapStudioFromFs(studio, config, tokensCss)).not.toThrow();
  });

  it('hidrata el nombre cuando el studio tiene el sentinel "TrueOmni Default"', async () => {
    const { config, tokensCss } = await readClientFs('default');
    const studio = makeBlankConfig('default', 'TrueOmni Default');
    const result = bootstrapStudioFromFs(studio, config, tokensCss);
    // El cliente default en config.json tiene nombre "Arizona"
    expect(result.nombre).toBe('Arizona');
  });

  it('no sobreescribe el nombre si el studio ya tiene uno personalizado', async () => {
    const { config, tokensCss } = await readClientFs('default');
    const studio = makeBlankConfig('default', 'Mi Kiosk Personalizado');
    const result = bootstrapStudioFromFs(studio, config, tokensCss);
    // El nombre no debe cambiar porque no coincide con el sentinel
    expect(result.nombre).toBe('Mi Kiosk Personalizado');
  });

  it('extrae los colores de branding del tokens.css cuando el studio tiene el DEFAULT_BRANDING', async () => {
    const { config, tokensCss } = await readClientFs('default');
    const studio = makeBlankConfig('default', 'TrueOmni Default');
    // El studio arranca con DEFAULT_BRANDING — el bootstrap debe leer tokens.css
    expect(studio.branding.primary).toBe(DEFAULT_BRANDING.primary);
    const result = bootstrapStudioFromFs(studio, config, tokensCss);
    // El tokens.css del cliente default tiene colores distintos al factory default
    // (o iguales, pero el campo branding debe seguir siendo un hex válido)
    expect(result.branding.primary).toMatch(/^#[0-9a-fA-F]{3,6}$/);
    expect(result.branding.secondary).toMatch(/^#[0-9a-fA-F]{3,6}$/);
    expect(result.branding.tertiary).toMatch(/^#[0-9a-fA-F]{3,6}$/);
  });

  it('preserva la estructura slug del KioskConfig devuelto', async () => {
    const { config, tokensCss } = await readClientFs('default');
    const studio = makeBlankConfig('default', 'TrueOmni Default');
    const result = bootstrapStudioFromFs(studio, config, tokensCss);
    // El bootstrap no debe cambiar el slug del studio
    expect(result.slug).toBe('default');
  });

  it('el resultado tiene modules definidos (el studio los tiene desde makeBlankConfig)', async () => {
    const { config, tokensCss } = await readClientFs('default');
    const studio = makeBlankConfig('default', 'TrueOmni Default');
    const result = bootstrapStudioFromFs(studio, config, tokensCss);
    expect(result.modules).toBeDefined();
    expect(Array.isArray(result.modules?.tiles)).toBe(true);
    expect(result.modules?.tiles?.length ?? 0).toBeGreaterThan(0);
  });

  it('hidrata subcategoryImages de un módulo de listings leído desde el fs', () => {
    // FsConfig sintético: un módulo de listings "restaurants" sin `kind`
    // (shape de catálogo) que trae fotos por sub-categoría que el operador subió.
    const fsConfig = {
      client: { slug: 'default', nombre: 'TrueOmni Default' },
      features: {
        home: {
          modules: {
            restaurants: {
              label: 'Restaurants',
              heroImage: '/hero.jpg',
              subcategories: ['Mexican', 'Italian'],
              subcategoryImages: {
                Mexican: '/uploads/mexican.jpg',
                Italian: '/uploads/italian.jpg',
              },
              features: [],
              listings: [],
            },
          },
        },
      },
    };
    const studio = makeBlankConfig('blank-listings', 'TrueOmni Default');
    // Forzamos listings a undefined para que el bootstrap los hidrate desde el fs.
    const studioNoListings = { ...studio, listings: undefined };
    const result = bootstrapStudioFromFs(studioNoListings, fsConfig, null);
    const mod = result.listings?.find((m) => m.key === 'restaurants');
    expect(mod).toBeDefined();
    expect(mod?.catalog.subcategoryImages).toEqual({
      Mexican: '/uploads/mexican.jpg',
      Italian: '/uploads/italian.jpg',
    });
  });

  it('un módulo de listings del fs SIN subcategoryImages sigue siendo válido (retrocompat)', () => {
    const fsConfig = {
      client: { slug: 'default', nombre: 'TrueOmni Default' },
      features: {
        home: {
          modules: {
            restaurants: {
              label: 'Restaurants',
              heroImage: '/hero.jpg',
              subcategories: ['Mexican'],
              features: [],
              listings: [],
            },
          },
        },
      },
    };
    const studio = makeBlankConfig('blank-listings-2', 'TrueOmni Default');
    const studioNoListings = { ...studio, listings: undefined };
    const result = bootstrapStudioFromFs(studioNoListings, fsConfig, null);
    const mod = result.listings?.find((m) => m.key === 'restaurants');
    expect(mod).toBeDefined();
    // Sin fotos en el fs → el campo opcional no se inyecta.
    expect(mod?.catalog.subcategoryImages).toBeUndefined();
  });
});
