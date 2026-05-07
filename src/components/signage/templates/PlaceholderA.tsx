import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Placeholder A — slide de prueba para verificar que el `<SignagePlayer>`
 * rota correctamente. Body region 1920×925. Será reemplazado en DS3+.
 */
function Render({}: SignageTemplateRenderProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-signage-brand-primary text-signage-text-on-brand">
      <div className="text-center">
        <p className="text-3xl font-medium opacity-80">Slide A</p>
        <h1 className="mt-4 text-9xl font-semibold tracking-tight">DS2 placeholder</h1>
        <p className="mt-6 text-xl opacity-70">Pixel-perfect templates land in DS3+</p>
      </div>
    </div>
  );
}

const PlaceholderA: SignageTemplate = {
  id: 'placeholder-a',
  label: 'Placeholder A',
  category: 'placeholder',
  slots: [],
  Render,
};

registerTemplate(PlaceholderA);

export default PlaceholderA;
