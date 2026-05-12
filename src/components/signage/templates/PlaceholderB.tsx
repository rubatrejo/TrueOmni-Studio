import { registerTemplate } from './registry';
import type { SignageTemplate, SignageTemplateRenderProps } from './types';

/**
 * Placeholder B — el segundo slide de prueba. Color distinto a PlaceholderA
 * para que el cambio sea visualmente evidente cuando el player rota.
 */
function Render({}: SignageTemplateRenderProps) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-signage-brand-accent text-signage-text-on-brand">
      <div className="text-center">
        <p className="text-3xl font-medium opacity-80">Slide B</p>
        <h1 className="mt-4 text-9xl font-semibold tracking-tight">DS2 rotation works</h1>
        <p className="mt-6 text-xl opacity-70">Default duration: see display.json</p>
      </div>
    </div>
  );
}

const PlaceholderB: SignageTemplate = {
  id: 'placeholder-b',
  orientation: 'landscape',
  label: 'Placeholder B',
  category: 'placeholder',
  slots: [],
  Render,
};

registerTemplate(PlaceholderB);

export default PlaceholderB;
