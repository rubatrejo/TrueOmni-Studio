'use client';

import { Eye, LayoutGrid, SlidersHorizontal } from 'lucide-react';

export type MobileEditorTab = 'sections' | 'editor' | 'preview';

/**
 * Tab bar mostrado debajo del TopBar cuando el viewport es `<lg` (1024px).
 * En `lg+` se oculta — el editor usa el layout side-by-side (sidebar +
 * editor + preview simultáneos).
 *
 * En `<lg` solo un panel es visible a la vez (Sections / Editor / Preview).
 * Esta barra permite al operador alternar entre los 3 con un tap, manteniendo
 * la funcionalidad completa del editor en tablets y laptops pequeños.
 *
 * Auto-flow esperado (manejado en Shell.tsx):
 * - Tap "Sections" → ver lista de secciones del editor
 * - Tap una sección del sidebar → cambia a tab "Editor" automáticamente
 * - Tap "Preview" → ver iframe del kiosk a panel completo
 */
export function MobileTabBar({
  active,
  onChange,
  className = '',
}: {
  active: MobileEditorTab;
  onChange: (tab: MobileEditorTab) => void;
  className?: string;
}) {
  return (
    <div
      className={`flex h-11 shrink-0 items-center justify-center gap-1 border-b border-zinc-200 bg-white px-3 dark:border-zinc-900 dark:bg-zinc-950 ${className}`}
    >
      <Tab
        id="sections"
        active={active === 'sections'}
        onClick={() => onChange('sections')}
        icon={<LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.75} />}
        label="Sections"
      />
      <Tab
        id="editor"
        active={active === 'editor'}
        onClick={() => onChange('editor')}
        icon={<SlidersHorizontal className="h-3.5 w-3.5" strokeWidth={1.75} />}
        label="Editor"
      />
      <Tab
        id="preview"
        active={active === 'preview'}
        onClick={() => onChange('preview')}
        icon={<Eye className="h-3.5 w-3.5" strokeWidth={1.75} />}
        label="Preview"
      />
    </div>
  );
}

function Tab({
  id,
  active,
  onClick,
  icon,
  label,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={`mobile-panel-${id}`}
      onClick={onClick}
      className={`inline-flex h-8 max-w-[140px] flex-1 items-center justify-center gap-1.5 rounded-md text-[12.5px] font-medium transition ${
        active
          ? 'bg-zinc-100 text-zinc-900 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-800'
          : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
