# S4-PLAN.md — i18n editor (base)

> Sub-fase: Studio S4 base. AI translate queda en S4.1.
> Spec: `docs/superpowers/specs/2026-04-29-studio-s4-i18n-design.md`.
> Fecha: 2026-04-29.

3 tareas atómicas. Una sola sesión.

---

<task type="auto">
  <name>T1 — Schema I18nBundleSchema + endpoint /api/studio/i18n/[slug]</name>
  <files>
    src/lib/studio/schema.ts (modificar — añadir LOCALES, LocaleStringsSchema, I18nBundleSchema, defaultI18nBundle),
    src/lib/studio/kv.ts (modificar — añadir kvKeys.i18n),
    src/app/api/studio/i18n/[slug]/route.ts (nuevo)
  </files>
  <action>
    Schema:
    - `LOCALES = ['en','es','fr','de','pt','ja'] as const`, type `Locale`.
    - `LocaleStringsSchema = z.record(z.string().max(2000))`.
    - `I18nBundleSchema = z.object({ en, es, fr, de, pt, ja: LocaleStringsSchema.default({}) })`.
    - `defaultI18nBundle()` retorna `{en:{}, es:{}, ...}`.

    KV:
    - `kvKeys.i18n = (slug) => \`i18n:\${slug}\``.

    Endpoint:
    - GET: lee `i18n:<slug>`. Si vacío, bootstrap leyendo `clients/<slug>/i18n/<locale>.json` con fallback `clients/_template/i18n/<locale>.json`. Devuelve `{ bundle }`.
    - PATCH: acepta body `{ bundle }` (full replace) o `{ patch: { locale: { key: value } } }` (deep merge). Valida con `I18nBundleSchema.safeParse` después del merge. Cap 480_000 bytes. 413 si excede.
    - Usar `loadLocale` de `src/lib/i18n-server.ts` para el bootstrap.

    Tipos exportados: `Locale`, `LocaleStrings`, `I18nBundle`.

  </action>
  <verify>
    `pnpm typecheck` limpio.
    Endpoint GET responde con bundle hidratado o seed correcto desde filesystem.
    PATCH con un cambio mínimo persiste y devuelve el bundle resultante.
  </verify>
  <done>
    Schema y endpoint en su sitio, sin warnings.
  </done>
</task>

---

<task type="auto">
  <name>T2 — I18nEditor side-by-side</name>
  <files>src/app/studio/_components/I18nEditor.tsx (nuevo)</files>
  <action>
    Layout:
    - Toolbar arriba: filtro Section (dropdown derivado del prefijo antes del primer `_`), search global, contador "X keys total · N missing en ES · M missing en FR · …".
    - Tabla virtualizada-light con header sticky: cols [Key · EN ★ · ES · FR · DE · PT · JA].
    - Filas: cada key del union sorted (`Object.keys(bundle.en) ∪ keys de otros locales`).
    - Celda = <textarea> 1-row collapsed con auto-grow on focus (rows=1 → rows=4).
    - Celda missing (no existe en `bundle[locale][key]` y sí en `bundle.en[key]`): borde `border-amber-300` + placeholder "missing".
    - Celda EN: pinta como referencia (no disabled — sí editable, pero con badge "canonical").
    - Filtro Section: deriva secciones de los prefijos `key.split('_')[0]` (ej. `tile`, `module`, `home`, `cta`, `survey`, etc.). Ordenadas alfabéticamente, con count de keys por sección.
    - Search: filtra rows donde `key.includes(q)` o cualquier `bundle[loc][key].toLowerCase().includes(q)`.
    - "Add key" button: prompt para nueva key (kebab/snake_case), añade a `bundle.en` con string vacío y se enfoca.

    Props: `value: I18nBundle, onChange: (next: I18nBundle) => void`.
    onChange immutable: clona, modifica el path puntual, devuelve nuevo bundle.

    Sin librerías nuevas. Tailwind + lucide-react ya disponibles.

  </action>
  <verify>
    `pnpm typecheck` limpio.
    Render mental con bundle de ~363 keys: header sticky, scroll vertical OK, no jank.
    auditor-white-label sin hallazgos (textos del Studio, no del kiosk → permitido).
  </verify>
  <done>
    Componente listo + accesible (aria-labels en textareas con la key).
    Light + dark mode coherentes con resto de editores.
  </done>
</task>

---

<task type="auto">
  <name>T3 — Wiring en EditorPanel + Shell + smoke E2E</name>
  <files>
    src/app/studio/_components/EditorPanel.tsx,
    src/app/studio/_components/Shell.tsx,
    src/app/studio/_lib/api-client.ts (modificar — añadir getI18n, patchI18n)
  </files>
  <action>
    `api-client.ts`:
    - `getI18n(slug): Promise<I18nBundle>` y `patchI18n(slug, payload): Promise<I18nBundle>`.

    `Shell.tsx`:
    - State `i18nBundle`/`savedI18nBundle`/`i18nDirty`.
    - Load en el `useEffect` inicial junto al config (Promise.all).
    - Push debounced (~250ms) tras cambio: PATCH del bundle completo.
    - Save bar: si `i18nDirty`, también guarda i18n.

    `EditorPanel.tsx`:
    - Añadir prop `i18n: I18nBundle, onI18nChange`.
    - Branch `sectionKey === 'i18n'` → renderiza `<I18nEditor />`.
    - Quitar `'i18n'` del set "no implementado" implícito (el switch de isImplemented ya devuelve coming-soon por defecto).

    Smoke E2E con Playwright:
    - Abrir `/studio/default`, click Languages.
    - Verificar tabla con ~363 keys.
    - Editar `tile_label_restaurants` en ES.
    - Esperar debounce → fetch al endpoint OK.
    - Reload → cambio persiste.
    - typecheck + lint limpios.

    Commit: `feat(studio): S4 base — i18n editor side-by-side con detección de missing keys`.

  </action>
  <verify>
    `pnpm typecheck && pnpm lint` limpios.
    Smoke pasa.
    Cambio persiste tras reload.
  </verify>
  <done>
    Tab Languages funcional fin a fin sin AI translate.
    Roadmap actualizado mencionando S4.1 (AI) como pendiente.
  </done>
</task>
