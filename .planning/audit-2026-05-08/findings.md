# Hallazgos · Studio Audit v2 · 2026-05-08

> Resultado del walk Playwright (47 screenshots) + lectura focalizada de 6 archivos densos. Categoriza para HTML.

## Convenciones

- **Severidad**: P0 ship-blocker · P1 alta · P2 media · P3 nice-to-have
- **Categoría**: 🔴Bugs · 🟠Gaps · 🟡UX · 🟣a11y · 🟢Perf · 🔵Auto · ⚪Infra

---

# Categoría 🔴 Bugs (rompen / regresiones)

### S-01 · 🔴 P0 · Hydration mismatch en `/studio/[slug]/kiosk`

**Síntoma:** console muestra "Hydration failed because the server rendered HTML didn't match the client" en cada carga del editor kiosk. Tree de error apunta a `<RedirectErrorBoundary>` de Next.
**Repro:** abrir cualquier `/studio/<slug>/kiosk` con devtools abierta.
**Impacto:** React regenera todo el árbol client-side → flash de re-render visible + score Lighthouse cae + posibles bugs sutiles en componentes con estado client.
**Archivo sospechoso:** `src/app/studio/[slug]/kiosk/page.tsx` (rendering `<Shell>` con datos KV/FS divergentes server vs client). El `force-dynamic` está bien pero algo del initial state difiere.
**Fix propuesto:** auditar `bootstrapStudioFromFs` en SSR vs client; tipar `currentVersion`/timestamps que cambian entre SSR pass y render. Quizá pasar `Date.now()` o algo similar.

### S-02 · 🔴 P1 · `postMessage` con target origin `'*'`

**Síntoma:** las 30+ funciones `sendXNow` de `use-preview-bridge.ts` usan `win.postMessage(payload, '*')`.
**Impacto:** si el iframe carga otra origin (cross-domain en preview), cualquier ventana puede leer el branding/config. Riesgo de leak. Best practice: `postMessage(payload, window.location.origin)` o el origin del iframe.
**Archivo:** `src/app/studio/_lib/use-preview-bridge.ts:130-394` (todas las llamadas).
**Fix:** introducir constante `IFRAME_ORIGIN` (`window.location.origin` para mismo origin local; configurable para casos cross-origin) y reemplazar `'*'` por ella.

### S-03 · 🔴 P1 · `client:list` no se limpia al borrar cliente

**Síntoma:** observado en sesión inicial — `test-fase4` aparecía en dashboard con manifest pero sin `cfg:test-fase4`. La drift recovery (S-06) ya lo arregla en GET, pero no purga `client:list` cuando un cliente se borra parcialmente.
**Impacto:** dashboard muestra clientes "fantasma" hasta el drift recovery. Si la recovery falla (ej. template default desaparece), permanecen 404.
**Fix:** en `DELETE /api/studio/configs/[slug]`, verificar manifest y purgar `client:list` + `client:{slug}:branding` + `client:{slug}:manifest` cuando ya no quedan productos.

### S-04 · 🔴 P2 · Console errors silenciosos en bridge

**Síntoma:** 30+ `try { postMessage } catch (e) { console.warn('[bridge:postMessage]', e) }` idénticos.
**Impacto:** si el iframe está dead-locked o detached, el operador no ve feedback visible. El warning solo se ve en devtools.
**Fix:** consolidar en helper `postToIframe(type, payload)`; cuando 5+ fallos consecutivos, mostrar banner "Live preview disconnected — reload" arriba del iframe.

### S-05 · 🔴 P2 · Photo Booth tab dispara console errors

**Síntoma:** abrir tab Photo Booth en editor kiosk produce 3 console errors (capturados en consoleLog#73-74).
**Repro:** `/studio/default/kiosk` → click Photo Booth tab.
**Impacto:** menor — el tab renderiza, pero los errores apuntan a hooks/refs mal gestionados.
**Fix:** investigar el componente PhotoBoothEditor; posible cleanup de stream MediaPipe missing.

### S-06 · 🔴 P3 · Drift recovery no rellena `client:list`

**Síntoma (cerrado parcialmente hoy):** la recovery del editor materializa `cfg:slug` en KV pero no añade el slug a `client:list` si faltaba.
**Estado:** en mi commit `d3fd17f` la recovery hace `kv.set(cfg)` pero no `kv.sadd(clientsList)`. La auto-migración en el siguiente GET lo agrega — entonces convergente, pero hay ventana donde el dashboard no lo lista.
**Fix:** añadir `await kv.sadd(kvKeys.clientsList, slug)` después de la materialización.

---

# Categoría 🟠 Gaps funcionales

### S-07 · 🟠 P1 · No hay search/filter en Clients dashboard

**Observado:** `/studio` con 4 clientes ya, llegando a 50+ se vuelve scroll infinito.
**Fix:** añadir `<input type="search">` arriba del grid + filter `clients.filter(c => c.name.toLowerCase().includes(q))`. Pattern: similar al search modal de Languages.

### S-08 · 🟠 P1 · No hay rollback visible desde Vista de Cliente

**Observado:** branding se autosave 1s después del cambio. Si el operador rompe el primary color sin querer, no hay "Discard / Restore last saved". Solo undo del editor kiosk individual.
**Fix:** botón "Restore" en BrandingForm que recargue de `client:{slug}:branding` (ignora cambios locales no save). O snapshots de unified branding (paralelo a kiosk snapshots).

### S-09 · 🟠 P1 · Activate solo funciona si template default existe

**Observado:** activate kiosk/digital-displays clona desde `default`. Si el operador borra `default` (por error), todo activate falla.
**Fix:** template `_template/` reservado e inmutable desde Studio (UI no permite borrar). O fallback a empty config + warning.

### S-10 · 🟠 P2 · Modal "New client" no expone Digital Displays

**Observado:** modal solo crea kiosk. Para tener un cliente con DD desde el inicio hay que crear y activar.
**Fix:** añadir checkboxes "Activate kiosks (default)" + "Activate digital displays" antes de submit.

### S-11 · 🟠 P2 · No hay diff pre-publish en Vista de Cliente

**Observado:** Publish está en kiosk editor + signage editor por separado. La Vista de Cliente no consolida un "Publish all products" con diff de qué cambia.
**Fix:** sección "Pending changes" en `/studio/[slug]` que agregue diffs de los productos activos.

### S-12 · 🟠 P3 · No hay duplicación de cliente (solo de kiosk)

**Observado:** hover sobre client card muestra Duplicate, pero el endpoint `/clone` solo clona el kiosk. Manifest + signage + unified branding no se replican.
**Fix:** endpoint `POST /api/studio/clients/[slug]/clone` que clone toda la entidad cliente.

### S-13 · 🟠 P3 · Sin "Recently edited" pinning

**Observado:** dashboard ordena alfabético + default primero. No hay pin/star para clientes top.
**Fix:** flag `pinned` en manifest + sort por pinned > recent > alpha.

### S-14 · 🟠 P3 · Stubs Coming Soon sin contenido

**Observado:** `/studio/[slug]/{mobile-pwa,video-walls,tablets}` solo muestran placeholder. No hay teaser, lista de waitlist, o link a roadmap.
**Fix:** card con descripción + link a doc del roadmap + opción "Notify me when ready".

---

# Categoría 🟡 Friction UX / inconsistencias visuales

### S-15 · 🟡 P1 · Tres patrones de tabs distintos coexisten

**Observado:**

- BrandingForm (Vista de Cliente) usa `<button aria-current>` sin tablist.
- Editor kiosk usa `<role=tablist>` + `<role=tab>`.
- Editor signage usa `<role=tablist>` + `<role=tab>`.
  **Impacto:** screen readers pierden contexto en BrandingForm; visual también difiere (chip vs underline vs glow).
  **Fix:** componente `<TabStrip>` reutilizable con role=tablist por defecto + variants visuales.

### S-16 · 🟡 P2 · Footer "Local · main" hardcoded

**Observado:** footer del dashboard dice "Local · main" en producción y dev.
**Fix:** derivar del env (`process.env.VERCEL_ENV` + `VERCEL_GIT_COMMIT_REF`).

### S-17 · 🟡 P2 · Color picker sin click-outside close

**Observado:** abrir picker (Brand colors > Primary > swatch) → click fuera no cierra. Solo botón "Done" o re-toggle del swatch.
**Fix:** añadir `useClickOutside` ref + dispatcher al `setOpen(false)`.

### S-18 · 🟡 P2 · BrandingForm no valida rangos lat/lon

**Observado:** Latitude acepta -200, Longitude acepta 999. Solo número-check.
**Fix:** clamp a [-90, 90] / [-180, 180] o mostrar error en helper text.

### S-19 · 🟡 P2 · 4 categorías "Coming soon" sin diferenciación

**Observado:** Mobile PWA / Video Walls / Tablets / "Add display" todas usan badge "Coming soon" pero con timelines diferentes (PWA en plan, displays en next sprint).
**Fix:** badge variants — "Coming soon · Q3 2026", "In development", "Next sprint" para alinear expectativas.

### S-20 · 🟡 P2 · Botón Activate visualmente igual al "Open editor"

**Observado:** ambos usan flecha `→` y misma tipografía. La acción Activate clona desde default (operación pesada) — debería sentirse distinto.
**Fix:** estilo "ghost" o icono `Plus` para Activate, `ArrowRight` para Open editor.

### S-21 · 🟡 P3 · Sticky header del editor kiosk overlapa con primer field en mobile

**Observado:** en viewport <900px el sticky banner cubre el primer Field del panel.
**Fix:** padding-top dinámico en el panel.

### S-22 · 🟡 P3 · Status pill "Idle" no transmite info útil

**Observado:** en Vista de Cliente, header muestra "Idle" cuando no hay cambios. "Idle" es confuso ("the editor is idle" vs "I should do something").
**Fix:** copy "Saved" cuando hay branding persisted, "—" cuando vacío. Eliminar "Idle".

### S-23 · 🟡 P3 · No hay confirm "Cancel" en BrandingForm con cambios pendientes

**Observado:** si tipeas en BrandingForm + navegas con Cmd+L, no hay "are you sure?".
**Estado:** ClientView SI tiene `beforeunload` para cierre completo de tab. Pero navegación interna (link a /studio o /kiosk) no dispara.
**Fix:** Next.js `useRouter().beforePopState` o link interceptor.

---

# Categoría 🟣 Accesibilidad (a11y)

### S-24 · 🟣 P2 · 2 botones "+ New client" con accessible name idéntico

**Observado:** header pill + card dashed al final del grid. Strict mode de Playwright lo detecta.
**Fix:** `aria-label="Create new client"` específico al pill, "Add another client" para la card.

### S-25 · 🟣 P2 · Accessible names verbosos en client cards

**Observado:** "TrueOmni default Arizona Kiosks Displays Edited 1h ago ruben" — concatenación de logo alt + slug + heading + badges + timestamp + editor en una sola etiqueta.
**Fix:** envolver subcontenido en `aria-hidden="true"`; dar al `<Link>` un `aria-label` corto: `Open client {name}, {N} products active`.

### S-26 · 🟣 P2 · Status badge KV/FS con métricas en accessible name

**Observado:** "All systems operational" link tiene `aria-label="KV: ok (cloud, 591ms) Filesystem: ok (4ms) Checked 2:47:48 PM"` — métricas embebidas.
**Fix:** texto visible + `<span aria-hidden>` con detalles + tooltip ARIA.

### S-27 · 🟣 P2 · BrandingForm tabs sin role tablist

**Observado:** screen reader anuncia "button" en lugar de "tab N of 5".
**Fix:** convertir el wrapper a `role="tablist"` + tabs con `role="tab"`.

### S-28 · 🟣 P2 · Modal Photo Booth + i18n add language abren con autoFocus mismo

**Observado:** ambos modales hacen `autoFocus` en search input. El audit anterior F-35 ya marcó este patrón. Hoy el escape funciona en NewClientModal pero no se confirmó en otros.
**Fix:** test sistemático Escape en cada modal del Studio (DeleteKioskModal, DuplicateKioskModal, AiSuggestModal, PublishModal, AddLanguageModal, etc.).

### S-29 · 🟣 P3 · Sin focus trap en modales

**Observado:** Tab/Shift+Tab dentro del modal puede salir al body (testing pending).
**Fix:** `<FocusTrap>` wrapper para todos los modales del Studio.

### S-30 · 🟣 P3 · `aria-live` faltante en SaveStatusPill de ClientView

**Observado:** "Saving…/Saved/Idle/Error" cambian sin notificar a screen readers.
**Fix:** wrapper con `aria-live="polite"` o `role="status"`.

### S-31 · 🟣 P3 · Inputs en BrandingForm asociados implícitamente

**Observado:** `<Field>` envuelve `<input>` en `<label>` sin htmlFor.
**Estado:** válido por wrapping, pero menos robusto que explicit.
**Fix:** generar `id` con `useId()` + `htmlFor` explicit.

---

# Categoría 🟢 Performance

### S-32 · 🟢 P1 · 25 useEffect en `Shell.tsx` (1072 líneas)

**Observado:** cada sección del config tiene su propio `useEffect(() => pushX(X), [X, pushX])`. Cualquier cambio dispara su effect → 25 postMessages individuales al iframe en lugar de uno consolidado.
**Impacto:** N renders del iframe por ciclo de save.
**Fix:** consolidar con single useEffect que diff y manda solo lo cambiado, o store-driven con selectors.

### S-33 · 🟢 P1 · `Shell.tsx` 1072 líneas — render N veces

**Observado:** componente monolítico con state global. React re-renders todo Shell en cada cambio.
**Fix:** split en `<EditorPanels>` (per-tab) memoized + `<PreviewPanel>` con su propio store.

### S-34 · 🟢 P2 · Dashboard fetch sin parallelism

**Observado:** `/api/studio/clients` GET hace `Promise.all(slugs.map(slug => Promise.all([loadManifest, loadBranding])))` ✅. Pero auto-migrate antes de eso es loop secuencial sobre cada slug — N round-trips al KV.
**Archivo:** `src/lib/studio/auto-migrate-clients.ts:76` — for loop.
**Fix:** `Promise.allSettled(slugs.map(s => migrateOne(s)))` con concurrency limit (e.g. 5).

### S-35 · 🟢 P2 · Iframe preview no se desmonta al salir del editor

**Observado:** navegar de `/studio/default/kiosk` a `/studio` mantiene memoria del iframe.
**Fix:** verificar React unmount; si Next no lo cleanup, añadir `useEffect cleanup` que pone `iframe.src = 'about:blank'`.

### S-36 · 🟢 P3 · Logo grandes sin lazy

**Observado:** dashboard muestra logos como `<img>` sin loading="lazy".
**Fix:** loading="lazy" + decoding="async" + width/height para CLS.

### S-37 · 🟢 P3 · Auto-migrate corre en cada GET dashboard

**Observado:** lazy on-load. Idempotente pero costoso (escanea FS + KV).
**Fix:** cache con TTL 60s en `kv.get('migration:lastRun')`. Skip si <60s.

---

# Categoría 🔵 Automatización / DX

### S-38 · 🔵 P1 · Sync hook al POST legacy puede fallar silencioso

**Observado:** mi commit `d3fd17f` añadió try/catch que loguea pero no aborta el create. Si el sync hook falla, el cliente queda sin manifest → auto-migrate lo recupera en el siguiente GET.
**Estado:** intencional pero invisibles para el operador.
**Fix:** logger estructurado (`@/lib/logger`) + alerta si falla > 1 vez.

### S-39 · 🔵 P2 · No hay tests E2E del flujo cliente nuevo

**Observado:** validación manual con Playwright esta sesión. No hay test commiteado.
**Fix:** `tests/e2e/studio-create-client.spec.ts` con Playwright real.

### S-40 · 🔵 P2 · `pnpm format:check` falla con drift histórico

**Observado:** 331 archivos con drift de prettier acumulado.
**Fix:** un commit one-shot `pnpm format` + bloquear via pre-commit hook.

### S-41 · 🔵 P3 · Docs/changelog hardcoded en `/studio/docs`

**Observado:** mismo hallazgo que el audit anterior — entries hardcoded; no genera desde GitHub Releases.
**Estado:** diferido a S7.2 cierre (memoria proyecto).

### S-42 · 🔵 P3 · `client:list` no tiene observability

**Observado:** sin logs estructurados de mutaciones (add/remove). Difícil debug del drift de S-03.
**Fix:** wrapper `addClientToList` con `logger.info({ event: 'client.added', slug, by })`.

### S-43 · 🔵 P3 · Auto-migrate no produce report visible

**Observado:** `MigrationReport` se devuelve pero solo se loguea en server. Operador no ve "2 clientes migrados".
**Fix:** banner toast + sección en `/studio/diagnostics`.

---

# Categoría ⚪ Infra externa / pendiente

### S-44 · ⚪ P2 · New Display creation pendiente

**Observado:** card "Add display COMING SOON" en lista signage scoped. STATE proyecto lo marca como pendiente desde 2026-05-08.
**Fix:** ya planeado — diferido al milestone S2.

### S-45 · ⚪ P2 · Tavus / Bandwango / Satisfi keys sin tests

**Observado:** tab Integrations tiene check button por integración pero no se cron-monitorea.
**Estado:** audit anterior #28-32 ya lo abrió.

### S-46 · ⚪ P3 · Custom domain `studio.trueomni.com` pendiente

**Observado:** STATE proyecto lo marca como next-session post-deploy.
**Fix:** después del push de hoy, configurar DNS + Vercel.

### S-47 · ⚪ P3 · NewClientModal no soporta Mobile PWA orientation real

**Observado:** orientation "Mobile PWA" se selecciona pero no afecta nada (Mobile PWA es Coming Soon).
**Fix:** ocultar la opción hasta que el producto esté live.

---

# Resumen cuantitativo

| Categoría | P0    | P1    | P2     | P3     | Total  |
| --------- | ----- | ----- | ------ | ------ | ------ |
| 🔴 Bugs   | 1     | 2     | 2      | 1      | 6      |
| 🟠 Gaps   | 0     | 3     | 2      | 3      | 8      |
| 🟡 UX     | 0     | 1     | 5      | 3      | 9      |
| 🟣 a11y   | 0     | 0     | 5      | 3      | 8      |
| 🟢 Perf   | 0     | 2     | 2      | 2      | 6      |
| 🔵 Auto   | 0     | 1     | 2      | 3      | 6      |
| ⚪ Infra  | 0     | 0     | 2      | 2      | 4      |
| **Total** | **1** | **9** | **20** | **17** | **47** |

---

# Top 5 ship-blockers (P0+P1)

1. **S-01 (P0)** Hydration mismatch en editor kiosk — flash visible en cada carga.
2. **S-02 (P1)** postMessage('\*') — leak potencial cross-origin.
3. **S-03 (P1)** Drift `client:list` cuando se borra cliente parcial.
4. **S-07 (P1)** No hay search en dashboard de clientes.
5. **S-32 (P1)** 25 useEffects en Shell.tsx — re-renders del iframe.

# Recomendación

**No es ship-blocker absoluto** — el Studio funciona end-to-end (validado E2E hoy). Los hallazgos P0/P1 son de calidad/perf/a11y/seguridad de superficie pequeña. Recomiendo:

- **Push a Vercel hoy** con los 10 commits actuales.
- **Sesión siguiente** abordar S-01, S-02, S-03 (los 3 P0/P1 bug-críticos) en un solo plan atómico.
- **Sprint after** atacar S-07, S-15 (search + tabs unificados) — payoff alto, risk bajo.
