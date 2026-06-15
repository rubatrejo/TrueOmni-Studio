import { describe, expect, it } from 'vitest';

import { BrandingSchema, DEFAULT_BRANDING, ListingsCatalogSchema, ModulesSchema } from './schema';

/**
 * Tests del BrandingSchema (F-QA-6 del audit).
 *
 * BrandingSchema requiere solo `primary`, `secondary` y `tertiary` (hex).
 * El resto de campos son opcionales. El sub-objeto `fonts` es .partial().optional()
 * y aplica defaults internamente (`display: 'Montserrat'`, `body: 'Open Sans'`)
 * solo cuando se provee el objeto (no cuando se omite completamente).
 */
describe('BrandingSchema', () => {
  // ─── casos válidos ────────────────────────────────────────────────────────

  it('acepta un branding mínimo con los tres colores hex requeridos', () => {
    const r = BrandingSchema.safeParse({
      primary: '#079EE2',
      secondary: '#004F8B',
      tertiary: '#B9BD39',
    });
    expect(r.success).toBe(true);
  });

  it('acepta colores hex en formato corto (#RGB)', () => {
    const r = BrandingSchema.safeParse({
      primary: '#09E',
      secondary: '#04B',
      tertiary: '#BB3',
    });
    expect(r.success).toBe(true);
  });

  it('acepta colores hex con letras mayúsculas y minúsculas mezcladas', () => {
    const r = BrandingSchema.safeParse({
      primary: '#aAbBcC',
      secondary: '#112233',
      tertiary: '#FfEeDd',
    });
    expect(r.success).toBe(true);
  });

  it('acepta branding completo con logo, favicon, idleLogo, footerLogo y fonts', () => {
    const r = BrandingSchema.safeParse({
      primary: '#004F8B',
      secondary: '#0088CE',
      tertiary: '#B9BD39',
      logo: 'assets/logo.svg',
      idleLogo: 'assets/idle-logo.svg',
      footerLogo: 'assets/footer-logo.svg',
      favicon: 'assets/favicon.svg',
      fonts: { display: 'Inter', body: 'Roboto' },
    });
    expect(r.success).toBe(true);
  });

  it('aplica default display=Montserrat y body=OpenSans cuando fonts se provee vacío', () => {
    const r = BrandingSchema.safeParse({
      primary: '#004F8B',
      secondary: '#0088CE',
      tertiary: '#B9BD39',
      fonts: {},
    });
    expect(r.success).toBe(true);
    if (r.success) {
      // Los campos de fonts tienen .default(), se aplican al parsear {}
      expect(r.data.fonts?.display).toBe('Montserrat');
      expect(r.data.fonts?.body).toBe('Open Sans');
    }
  });

  it('acepta heroLogoSize como enum S/M/L/XL', () => {
    for (const size of ['S', 'M', 'L', 'XL'] as const) {
      const r = BrandingSchema.safeParse({
        primary: '#004F8B',
        secondary: '#0088CE',
        tertiary: '#B9BD39',
        heroLogoSize: size,
      });
      expect(r.success).toBe(true);
    }
  });

  it('acepta homeHero con kind=image o kind=video', () => {
    const r = BrandingSchema.safeParse({
      primary: '#004F8B',
      secondary: '#0088CE',
      tertiary: '#B9BD39',
      homeHero: { kind: 'video', src: '/assets/hero.mp4' },
    });
    expect(r.success).toBe(true);
  });

  it('los colores del DEFAULT_BRANDING pasan la validación', () => {
    const r = BrandingSchema.safeParse(DEFAULT_BRANDING);
    expect(r.success).toBe(true);
  });

  // ─── casos inválidos ──────────────────────────────────────────────────────

  it('rechaza primary con valor no-hex (cadena de texto)', () => {
    const r = BrandingSchema.safeParse({
      primary: 'azul',
      secondary: '#0088CE',
      tertiary: '#B9BD39',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza primary con formato hex inválido (#ZZZ)', () => {
    const r = BrandingSchema.safeParse({
      primary: '#ZZZ',
      secondary: '#0088CE',
      tertiary: '#B9BD39',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza secondary con valor no-hex (rgb())', () => {
    const r = BrandingSchema.safeParse({
      primary: '#004F8B',
      secondary: 'rgb(0,136,206)',
      tertiary: '#B9BD39',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza tertiary con formato hex de 5 dígitos (inválido)', () => {
    const r = BrandingSchema.safeParse({
      primary: '#004F8B',
      secondary: '#0088CE',
      tertiary: '#B9BD3',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza branding cuando falta primary', () => {
    const r = BrandingSchema.safeParse({
      secondary: '#0088CE',
      tertiary: '#B9BD39',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza branding cuando falta secondary', () => {
    const r = BrandingSchema.safeParse({
      primary: '#004F8B',
      tertiary: '#B9BD39',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza branding cuando falta tertiary', () => {
    const r = BrandingSchema.safeParse({
      primary: '#004F8B',
      secondary: '#0088CE',
    });
    expect(r.success).toBe(false);
  });

  it('rechaza heroLogoSize con valor fuera del enum', () => {
    const r = BrandingSchema.safeParse({
      primary: '#004F8B',
      secondary: '#0088CE',
      tertiary: '#B9BD39',
      heroLogoSize: 'XXL',
    });
    expect(r.success).toBe(false);
  });
});

/**
 * Tests de `ListingsCatalogSchema` enfocados en `subcategoryImages` (fotos por
 * sub-categoría del kiosk, name → URL). Campo opcional → retrocompat con
 * configs antiguos que no lo traen.
 */
describe('ListingsCatalogSchema — subcategoryImages', () => {
  it('un catálogo SIN subcategoryImages sigue siendo válido (retrocompat)', () => {
    const r = ListingsCatalogSchema.safeParse({
      heroImage: '',
      subcategories: ['Mexican', 'Italian'],
      features: [],
      listings: [],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      // El campo es opcional: no se inyecta cuando se omite.
      expect(r.data.subcategoryImages).toBeUndefined();
    }
  });

  it('acepta subcategoryImages como mapa string → string', () => {
    const r = ListingsCatalogSchema.safeParse({
      heroImage: '',
      subcategories: ['Mexican', 'Italian'],
      subcategoryImages: {
        Mexican: '/uploads/mexican.jpg',
        Italian: 'https://cdn.example.com/italian.png',
      },
      features: [],
      listings: [],
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.subcategoryImages).toEqual({
        Mexican: '/uploads/mexican.jpg',
        Italian: 'https://cdn.example.com/italian.png',
      });
    }
  });

  it('rechaza subcategoryImages con un valor no-string', () => {
    const r = ListingsCatalogSchema.safeParse({
      heroImage: '',
      subcategories: ['Mexican'],
      subcategoryImages: { Mexican: 123 },
      features: [],
      listings: [],
    });
    expect(r.success).toBe(false);
  });
});

describe('ModulesSchema — tileOverlayOpacity', () => {
  const baseTiles = [{ key: 'restaurants', label: 'Restaurants', enabled: true }];

  it('omitido sigue siendo válido (retrocompat) y queda undefined', () => {
    const r = ModulesSchema.safeParse({ tiles: baseTiles });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.tileOverlayOpacity).toBeUndefined();
  });

  it('acepta y preserva un porcentaje entero en rango (0, 35, 100)', () => {
    for (const v of [0, 35, 100]) {
      const r = ModulesSchema.safeParse({ tiles: baseTiles, tileOverlayOpacity: v });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.tileOverlayOpacity).toBe(v);
    }
  });

  it('rechaza valores fuera de rango (>100 o <0) y no enteros', () => {
    for (const v of [150, -1, 35.5]) {
      const r = ModulesSchema.safeParse({ tiles: baseTiles, tileOverlayOpacity: v });
      expect(r.success).toBe(false);
    }
  });
});
