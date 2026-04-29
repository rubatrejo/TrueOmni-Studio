# S6-PLAN.md — Integrations editor + health checks

> Sub-fase: Studio S6. Sigue de S5.
> Fecha: 2026-04-29.

3 tareas atómicas.

---

<task type="auto">
  <name>T1 — Schema IntegrationsConfig + endpoint patch + health check</name>
  <files>
    src/lib/studio/schema.ts (modificar — IntegrationsConfigSchema, defaults, integrar en KioskConfig),
    src/app/api/studio/configs/[slug]/route.ts (modificar — PATCH soporta integrations),
    src/app/api/studio/integrations/check/route.ts (nuevo — health check server-side)
  </files>
  <action>
    Schema:
    - `IntegrationsConfigSchema` con sub-objetos:
      - `api: { baseUrl: string.max(2048).default('') }`
      - `mapbox: { token: string.max(2048).default('') }`
      - `analytics: { gaId: string.max(64).default('') }` (Google Analytics tracking ID)
      - `weather: { provider: 'open-meteo'|'openweather'.default('open-meteo'), apiKey?: string, city?: string, units: 'metric'|'imperial'.default('metric') }`
    - `defaultIntegrations()`.
    - Integrar en `KioskConfigSchema` y `makeBlankConfig`.

    Endpoint configs/[slug]/route.ts:
    - hydrateConfig backfill `integrations: cfg.integrations ?? defaultIntegrations()`.
    - body type añade `integrations?`.
    - Validación zod en PATCH.

    Endpoint check (nuevo):
    - `POST /api/studio/integrations/check` body `{ kind: 'mapbox'|'api'|'analytics'|'openweather', value: string|object }`.
    - mapbox: GET `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token={token}`. 200 → ok, 401/403 → invalid token.
    - api: GET al baseUrl. 2xx/3xx → ok. Timeout 5s.
    - analytics: regex test `^(G-[A-Z0-9]+|UA-\d+-\d+)$`.
    - openweather: GET `https://api.openweathermap.org/data/2.5/weather?q={city}&appid={key}&units={units}`. 200 → ok.
    - Devuelve `{ ok: boolean, message: string }`. Errores HTTP capturados con AbortController + timeout.
  </action>
  <verify>
    `pnpm typecheck` limpio.
    GET retorna `config.integrations` con defaults para clientes legacy.
    PATCH `{integrations}` persiste.
    POST `/api/studio/integrations/check` con `{kind:'analytics', value:'G-ABC123'}` → ok.
  </verify>
  <done>
    Schema + endpoints listos sin warnings.
  </done>
</task>

---

<task type="auto">
  <name>T2 — IntegrationsEditor con 4 cards + health checks</name>
  <files>src/app/studio/_components/IntegrationsEditor.tsx (nuevo)</files>
  <action>
    Layout: 4 cards apiladas, cada una con icono + título + descripción + campos + botón "Test".

    Cards:
    1. **Weather** — provider (radio open-meteo/openweather), si openweather: apiKey + city + units. open-meteo no necesita key.
    2. **API base URL** — input. Test → status code visible.
    3. **Mapbox** — token (password mask + show toggle). Test → "Token valid" / "Invalid token".
    4. **Google Analytics** — gaId. Test (regex) → "Format valid" / "Use G-XXX or UA-X-X".

    Cada Test button:
    - Disabled si el value está vacío.
    - Loading spinner durante el request.
    - Resultado inline (verde ok / rojo error) con icono Check/AlertCircle, autodescarte 6s.

    Tokens secret-ish (mapbox token, openweather key) usar input type=password con eye toggle.
  </action>
  <verify>
    `pnpm typecheck && pnpm lint` limpios.
  </verify>
  <done>
    Editor renderiza 4 cards funcionales con health check.
  </done>
</task>

---

<task type="auto">
  <name>T3 — Wiring + smoke E2E + commits</name>
  <files>
    src/app/studio/_components/EditorPanel.tsx,
    src/app/studio/_components/Shell.tsx,
    src/app/studio/_lib/api-client.ts (modificar — checkIntegration)
  </files>
  <action>
    api-client: `checkIntegration(input): Promise<{ok, message}>`.
    Shell: state integrations + dirty + save (en payload de patchConfig junto a las otras secciones).
    EditorPanel: prop integrations + branch sectionKey === 'integrations' → `<IntegrationsEditor />`.
    Smoke: navegar a Integrations, editar GA ID 'G-ABC123', click Test → ok visible. Save → persiste.
    Commits: feat + docs(state).
  </action>
  <verify>
    `pnpm typecheck && pnpm lint` limpios.
    Smoke pasa.
  </verify>
  <done>
    Tab Integrations operativa con health checks.
  </done>
</task>
