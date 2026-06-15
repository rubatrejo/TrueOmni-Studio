'use client';

import { TrueOmniLogo } from '@/components/brand/true-omni-logo';
import { LanguageDropdown } from '@/components/home/language-dropdown';
import { useTextosMap } from '@/components/i18n-provider';

/**
 * "Powered by" + logo de marca. Reusa el mismo bloque que vive en el footer de
 * la variante 1 (Billboard0). Self-contained (sin posición absoluta): cada
 * variante lo coloca donde estaba el botón de idioma.
 */
export function BillboardPoweredBy() {
  const t = useTextosMap();
  return (
    <div>
      <span
        className="block italic text-white"
        style={{
          fontFamily: '"Open Sans", system-ui, sans-serif',
          fontSize: '20px',
          fontWeight: 500,
          letterSpacing: '0.01em',
          lineHeight: '1',
        }}
      >
        {t.billboard_powered_by ?? 'Powered by'}
      </span>
      <TrueOmniLogo slot="brand" className="mt-[6px] h-[32px] w-auto text-white" />
    </div>
  );
}

/**
 * Slot del footer del idle para las variantes 2/3/4: muestra el selector de
 * idioma cuando el módulo Languages está activo; si está desactivado, el
 * selector desaparece y en su lugar se muestra el "Powered by" (como la
 * variante 1). `data-billboard-no-link` evita que el tap del dropdown dispare
 * la navegación del Billboard.
 */
export function BillboardLanguageSlot({ languagesEnabled }: { languagesEnabled: boolean }) {
  if (languagesEnabled) {
    return (
      <div data-billboard-no-link>
        <LanguageDropdown />
      </div>
    );
  }
  return <BillboardPoweredBy />;
}
