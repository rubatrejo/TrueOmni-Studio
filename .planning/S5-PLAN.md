# S5-PLAN.md — Ads system editor

> Sub-fase: Studio S5. Sigue de S4.1.
> Fecha: 2026-04-29.

3 tareas atómicas. Una sesión.

---

<task type="auto">
  <name>T1 — Schema AdsModule + integrar en KioskConfig + PATCH</name>
  <files>
    src/lib/studio/schema.ts (modificar — AdSchema, AdsModuleSchema, defaultAds, makeBlankAd, integrar en KioskConfig + makeBlankConfig),
    src/app/api/studio/configs/[slug]/route.ts (modificar — PATCH soporta `ads` y hydrateConfig backfill)
  </files>
  <action>
    Schema (espejo de `Ad`/`AdvertisementsConfig` en src/lib/config.ts):
    - `AD_KINDS = ['popup','hero','bottom'] as const`, `AD_THEMES = ['dark','light']`.
    - `AdSchema = z.object({ id: SlugStringSchema, kind: z.enum(AD_KINDS), image, alt?, routes: z.array(z.string().min(1)), enabled: z.boolean().default(true), theme: z.enum(AD_THEMES).default('dark') })`.
    - `AdsModuleSchema = z.object({ ads: z.array(AdSchema).superRefine(uniqueById).default([]) })`.
    - `defaultAds()` retorna `{ ads: [] }`.
    - `makeBlankAd(kind='popup'): Ad` con id `ad-${Date.now()}`.
    - Añadir `ads: AdsModuleSchema.default(defaultAds())` al `KioskConfigSchema`.
    - Backfill en `makeBlankConfig`.

    Endpoint `[slug]/route.ts`:
    - Importar `AdsModuleSchema, defaultAds`.
    - `hydrateConfig` añade `ads: cfg.ads ?? defaultAds()`.
    - Añadir branch `if (body.ads !== undefined)` con `AdsModuleSchema.safeParse`.

  </action>
  <verify>
    `pnpm typecheck` limpio.
    GET retorna `config.ads = { ads: [] }` para clientes legacy.
    PATCH `{ ads }` persiste y el GET subsiguiente lo refleja.
  </verify>
  <done>
    Schema + endpoint listos sin warnings.
  </done>
</task>

---

<task type="auto">
  <name>T2 — AdsEditor</name>
  <files>src/app/studio/_components/AdsEditor.tsx (nuevo)</files>
  <action>
    Patrón consistent con EventsEditor / TrailsEditor: search + filtro por kind + Add ad + per-item edit panel.

    Per-item form fields:
    - Title-bar: id (auto-generated, editable kebab) + thumbnail preview de la imagen.
    - `kind` select [popup, hero, bottom].
    - `image` ImageUrlField (path o URL).
    - `alt` text.
    - `routes` multi-input: textarea con una ruta por línea, hint "Use /home/*  for prefix matching".
    - `enabled` toggle.
    - `theme` select [dark, light] con ayuda "controls the X-button color".

    Lista (CatalogList drag&drop):
    - Thumbnail 60×60 contain.
    - Subtitle: "{kind} · {routes count} routes · {enabled ? 'on' : 'off'}".
    - Filtro por kind (dropdown).

    Bulk import opcional: por ahora NO (los ads son pocos por cliente, edit a mano). S5.1 si se necesita.

  </action>
  <verify>
    `pnpm typecheck && pnpm lint` limpios.
    Render mental con 4 ads del default: lista visible, filtro por popup funciona.
  </verify>
  <done>
    AdsEditor con CRUD completo de ads.
  </done>
</task>

---

<task type="auto">
  <name>T3 — Wiring Shell + EditorPanel + smoke E2E</name>
  <files>
    src/app/studio/_components/EditorPanel.tsx,
    src/app/studio/_components/Shell.tsx,
    src/app/studio/_lib/api-client.ts,
    src/app/studio/_lib/sections.ts (verificar key 'ads' ya está)
  </files>
  <action>
    api-client: ya existe `patchConfig` con `ads?` añadible al payload type.

    Shell:
    - Importar `AdsModule, defaultAds`.
    - State `savedAds`/`ads`/`adsDirty`.
    - Añadir a `payload`/save/discard como otros módulos.

    EditorPanel:
    - Props `ads, onAdsChange`.
    - Branch `sectionKey === 'ads'` → `<AdsEditor />`.
    - Añadir 'ads' al set isImplemented.

    Smoke E2E con Playwright:
    - Navegar a Ads tab → AdsEditor visible.
    - Default cliente tiene 4 ads (cargan desde KV vía hydrateConfig).
    - Add ad → aparece en lista.
    - Cambiar kind → filtro lo refleja.
    - Save → reload → persiste.

  </action>
  <verify>
    `pnpm typecheck && pnpm lint` limpios.
    Smoke pasa.
  </verify>
  <done>
    Tab Ads operativa fin a fin.
    Commit con mensaje feat(studio): S5 — ads system editor con CRUD por kind.
  </done>
</task>
