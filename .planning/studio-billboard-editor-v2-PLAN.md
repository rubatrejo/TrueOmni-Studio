# Studio — Idle/Billboard Editor v2 — PLAN

**Fecha:** 2026-04-30
**Milestone:** Studio (iteración polish UX/funcional).
**Brainstorm aprobado por Rubén:** 2026-04-30 (sesión actual).

---

## Objetivo

Reemplazar las miniaturas con gradients del selector de Idle/Billboard por **wireframes neutros** (4 SVGs mono-color zinc, solo cajas/divisores) y permitir **edición de contenido por layout**:

- **Logo size** (presets S/M/L) en B0/B2/B3.
- **Módulos visibles** (4 slots fijos elegidos del Modules tab) en B1/B2/B3.

Sin tocar el código de los componentes `billboard-N.tsx`: todo se configura desde Studio y llega al kiosk vía bridge.

---

## Decisiones del brainstorm

| Tema                          | Decisión                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| Slots por variant             | 4 fijos en B1/B2/B3. B0 no tiene grid de módulos.                                                     |
| Origen de la lista de módulos | Solo módulos ON en el `Modules tab` (warning inline si <4 activos).                                   |
| Logo size                     | Presets `S=80px` / `M=128px` (default) / `L=180px`. Aplica a B0/B2/B3 (B1 no tiene logo idle grande). |
| Reorder de módulos            | Drag handle vertical (lucide `GripVertical`).                                                         |
| Custom CTA color/size         | **Out of scope v2** — los textos ya son i18n (`billboard_touch_here` / `billboard_touch_to_start`).   |
| Wireframes                    | Border `1px solid zinc-400` + labels mini (10px uppercase). Cero gradients, cero imágenes.            |

---

## Schema (extensión)

```ts
// src/lib/studio/schema.ts
export const BillboardSchema = z.object({
  variant: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  idleTimeoutSec: z.number().int().min(15).max(600).default(60),
  logoSize: z.enum(['S', 'M', 'L']).default('M'),
  modules: z.array(z.string()).max(4).default([]),
});
```

`DEFAULT_BILLBOARD` se actualiza con `logoSize: 'M'` + `modules: []`. `bootstrap-from-fs.ts` y `publish-merger.ts` deben preservar valores nuevos al cargar/publicar.

---

## Tareas atómicas

<task type="auto">
  <name>Extender BillboardSchema + bootstrap + publish-merger</name>
  <files>
    src/lib/studio/schema.ts
    src/lib/studio/bootstrap-from-fs.ts
    src/lib/studio/publish-merger.ts
  </files>
  <action>
    Añadir `logoSize: 'S'|'M'|'L'` y `modules: string[]` al BillboardSchema.
    Actualizar DEFAULT_BILLBOARD.
    En bootstrap-from-fs leer `branding.idleLogoSize?` y `home.modules?` si existen para hidratar.
    En publish-merger volcar billboard.{logoSize, modules} al config.json publicado.
  </action>
  <verify>pnpm check limpio.</verify>
  <done>Schema acepta los nuevos campos sin romper configs existentes.</done>
</task>

<task type="auto">
  <name>Crear 4 wireframes SVG</name>
  <files>
    src/app/studio/_components/billboard-wireframes/Wireframe0.tsx
    src/app/studio/_components/billboard-wireframes/Wireframe1.tsx
    src/app/studio/_components/billboard-wireframes/Wireframe2.tsx
    src/app/studio/_components/billboard-wireframes/Wireframe3.tsx
    src/app/studio/_components/billboard-wireframes/index.ts
  </files>
  <action>
    SVGs `viewBox="0 0 90 160"` (proporción 9:16), `stroke="currentColor"` `fill="none"` `strokeWidth=1`.
    Cada uno representa la división del layout: cajas + divisores + footer.
    Labels mini `<text>` 5pt opcional con id del slot.
    Color via `text-zinc-400 dark:text-zinc-600`.
  </action>
  <verify>Render en Storybook simulado: 4 SVGs aparecen como wireframes claros, sin colores de relleno.</verify>
  <done>Las 4 miniaturas reflejan la estructura del layout sin imágenes.</done>
</task>

<task type="auto">
  <name>Reescribir BillboardEditor con UI condicional por variant</name>
  <files>
    src/app/studio/_components/BillboardEditor.tsx
    src/app/studio/_components/Shell.tsx
  </files>
  <action>
    Sustituir VARIANT_INFO.gradient por `<WireframeN />`.
    Añadir sección "Logo size" (3 botones segmented) — oculta si variant === 1.
    Añadir sección "Modules in this layout" — 4 slots con dropdown + drag handle. Oculta si variant === 0.
    Slot dropdown: opciones = `modulesAvailable` (módulos ON en Modules tab) — Shell pasa ese array como prop.
    Reorder = setState con array swap.
    Si modulesAvailable.length < 4 → warning `<p className="text-xs text-amber-500">Activa al menos 4 módulos en Modules tab para usar este billboard.</p>`.
  </action>
  <verify>UI visible, dropdowns funcionan, drag reorder funciona.</verify>
  <done>Cambiar variant cambia la subsección de controles correctamente.</done>
</task>

<task type="auto">
  <name>Bridge wiring + listeners en billboard-{0,1,2,3}.tsx</name>
  <files>
    src/app/studio/_lib/use-preview-bridge.ts
    src/components/studio-bridge.tsx
    src/components/billboard/billboard-0.tsx
    src/components/billboard/billboard-1.tsx
    src/components/billboard/billboard-2.tsx
    src/components/billboard/billboard-3.tsx
  </files>
  <action>
    use-preview-bridge: incluir `billboard.logoSize` y `billboard.modules` en el payload de override.
    studio-bridge: extender BrandingOverride con esos campos, dispatch evento `kiosk:billboard-override` con detail `{ logoSize, modules }`.
    En cada billboard-N: hook `useBillboardOverride()` (factor común en `billboard-link.tsx` o helper nuevo) que escucha el evento y devuelve `{ logoSize, modules }`.
    B0/B2/B3 leen logoSize → mapean a px (80/128/180) en el style del logo.
    B1/B2/B3 leen modules → mapean a slots usando un MODULE_REGISTRY (id → { image, label, href }).
  </action>
  <verify>Cambiar variant/logoSize/modules en Studio refleja en iframe en <300ms.</verify>
  <done>Sin recargar, los 4 layouts respetan los overrides.</done>
</task>

<task type="auto">
  <name>Verificación end-to-end + commit</name>
  <files>—</files>
  <action>
    pnpm check (typecheck + lint + format:check) limpio.
    pnpm kiosk:dev arranca sin ENOENT (regla CLAUDE.md sección 9).
    Smoke manual: abrir /studio/{slug}, cambiar variant, logoSize, modules; verificar preview live.
    Commit Conventional en español: `feat(studio): idle/billboard editor v2 — wireframes + logo size + módulos por layout`.
  </action>
  <verify>Build dev limpio + commit creado.</verify>
  <done>Editor v2 mergeado a main, sin regresiones detectables en smoke.</done>
</task>

---

## Out of scope (v2.1+)

- **Aplicar `billboard.modules` al rendering de los Billboards** — ahora mismo el array persiste en config y viaja al kiosk vía bridge, pero los componentes `billboard-{0,1,2,3}.tsx` siguen renderizando los slots con labels/imágenes/iconos hardcoded del SVG original. Cada layout tiene un diseño muy específico (B1: 2 cards 495×410 + 2 cards 495×208 olive/azul con iconos custom; B2: carousel array-driven CARDS; B3: 4 cards con imágenes específicas + banner) y reescribirlos para que respeten orden + label + imagen + href del módulo elegido es trabajo dedicado v2.1. Lo que SÍ funciona en v2: el usuario edita la lista en Studio, el config persiste correctamente al publicar, el bridge ya envía el array al kiosk para futura activación.
- Custom hex de fondo del CTA, custom font size del CTA.
- Custom card del carousel B2 (imagen libre + label libre, sin link a módulo).
- Más de 4 slots (B2 carousel dinámico de N=2..8).
- Editor visual de la posición/tamaño de cada slot.
