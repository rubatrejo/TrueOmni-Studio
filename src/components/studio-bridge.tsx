'use client';

import { useEffect } from 'react';

const HIDE_DEV_INDICATOR_STYLE_ID = 'studio-bridge-hide-dev-indicator';
const HIDE_DEV_INDICATOR_CSS = `
  /* Hide Next.js dev indicator when kiosk is embedded inside the Studio iframe.
     Selectors cover both stable and dev-only Next 15 indicators. */
  nextjs-portal,
  [data-nextjs-toast],
  [data-nextjs-toast-root],
  #__next-build-watcher,
  #__next-prerender-indicator {
    display: none !important;
  }
`;

const FONT_LINK_PREFIX = 'studio-bridge-font-';

/**
 * Bridge runtime kiosk ↔ Studio.
 *
 * Escucha `postMessage` del host (Studio) y aplica las CSS variables del
 * branding al `:root` del documento del kiosk, sin remontar componentes.
 *
 * Mensaje soportado (host → kiosk):
 *   `{ type: 'studio:branding-update', branding: {
 *       primary, secondary, tertiary,    // HSL "H S% L%"
 *       logo?, favicon?,                  // data URLs
 *       fonts?: { display?, body? }       // Google Font names
 *   }}`
 *
 * Mensaje legacy soportado (compat):
 *   `{ type: 'studio:brand-update', brand: { primary, secondary, tertiary } }`
 *
 * Mensajes emitidos (kiosk → host):
 *   - `{ type: 'studio:ready' }`  con re-anuncios para cubrir races.
 */
export function StudioBridge() {
  // Oculta el Next.js dev indicator cuando el kiosk está embebido.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let isEmbedded = false;
    try {
      isEmbedded = window.parent !== window;
    } catch {
      isEmbedded = true;
    }
    if (!isEmbedded) return;

    if (document.getElementById(HIDE_DEV_INDICATOR_STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = HIDE_DEV_INDICATOR_STYLE_ID;
    style.textContent = HIDE_DEV_INDICATOR_CSS;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = (event: MessageEvent) => {
      const data = event.data as
        | { type?: string; brand?: BrandPatch; branding?: BrandingPatch }
        | null;
      if (!data || typeof data !== 'object' || !data.type) return;

      switch (data.type) {
        case 'studio:branding-update':
          if (data.branding) applyBranding(data.branding);
          break;
        case 'studio:brand-update':
          // Legacy: solo colores.
          if (data.brand) applyBranding(data.brand);
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handler);

    const announceReady = () => {
      try {
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'studio:ready' }, '*');
        }
      } catch {}
    };
    announceReady();
    const t1 = setTimeout(announceReady, 50);
    const t2 = setTimeout(announceReady, 250);
    const t3 = setTimeout(announceReady, 800);

    return () => {
      window.removeEventListener('message', handler);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return null;
}

type BrandPatch = {
  primary?: string;
  secondary?: string;
  tertiary?: string;
};

type BrandingPatch = BrandPatch & {
  logo?: string;
  favicon?: string;
  fonts?: { display?: string; body?: string };
};

const injectedFontLinks = new Set<string>();

function applyBranding(branding: BrandingPatch) {
  const root = document.documentElement;
  const set = (name: string, value: string | undefined) => {
    if (!value) return;
    root.style.setProperty(name, value, 'important');
  };
  set('--brand-primary', branding.primary);
  set('--brand-secondary', branding.secondary);
  set('--brand-tertiary', branding.tertiary);

  // Fonts dinámicas vía Google Fonts. Inyecta <link> por familia y override
  // las CSS vars que Tailwind / componentes consumen.
  const display = branding.fonts?.display;
  const body = branding.fonts?.body;
  if (display) {
    ensureGoogleFont(display);
    root.style.setProperty(
      '--font-display',
      `"${display}", var(--font-noto-jp, "Noto Sans JP"), system-ui, -apple-system, "Segoe UI", sans-serif`,
      'important',
    );
  }
  if (body) {
    ensureGoogleFont(body);
    root.style.setProperty(
      '--font-sans',
      `"${body}", var(--font-noto-jp, "Noto Sans JP"), system-ui, -apple-system, "Segoe UI", sans-serif`,
      'important',
    );
  }

  // Favicon dinámico.
  if (branding.favicon) {
    setFavicon(branding.favicon);
  }
}

function ensureGoogleFont(family: string) {
  const id = FONT_LINK_PREFIX + family.replace(/\s+/g, '-').toLowerCase();
  if (injectedFontLinks.has(id) || document.getElementById(id)) return;
  injectedFontLinks.add(id);

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

function setFavicon(href: string) {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}
