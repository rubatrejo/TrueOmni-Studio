# PLAN — F-HUB-7: monitor de salud de integraciones

> Diseño: `STUDIO-fhub7-integrations-health-DESIGN.md`. 2 commits temáticos.

## Commit 1 — motor + endpoint + KV

```xml
<task type="auto">
  <name>Motor de salud compartido + endpoint + KV key</name>
  <files>
    src/lib/studio/integrations-health.ts (nuevo),
    src/app/api/studio/integrations/smoke/route.ts (refactor),
    src/lib/studio/kv.ts (kvKeys.integHealth),
    src/app/api/studio/integrations/health/[slug]/route.ts (nuevo),
    src/app/studio/_lib/api-client.ts (helpers)
  </files>
  <action>
    Extraer runChecksForKiosk del smoke a integrations-health.ts:
      - buildChecks(integrations) cubriendo los 9 providers (añade bandwango/crowdriff/viator).
      - runIntegrationChecks(integrations,{origin}) (self-fetch a /check, concurrency 4).
      - summarizeHealth(results) → {totals, overall}.
      - tipos exportados: IntegrationKind, IntegrationCheckResult, IntegrationHealthSnapshot, etc.
    Refactorizar smoke/route.ts para consumir el motor (mismo contrato de salida).
    Añadir kvKeys.integHealth(slug) = `integ:${slug}:health`.
    Crear health/[slug]/route.ts: POST (working-copy si body.integrations, saved si no) persiste
      snapshot TTL 90d + lo devuelve; GET devuelve snapshot o null.
    api-client: getIntegrationsHealth(slug), runIntegrationsHealth(slug, integrations?).
  </action>
  <verify>
    pnpm typecheck && pnpm lint (sin warnings nuevos) && pnpm validate:configs.
    Smoke conserva su shape de respuesta.
  </verify>
  <done>
    El motor corre los 9 checks; el endpoint persiste/lee el snapshot; smoke sigue verde.
    Commit + push → deploy Vercel READY.
  </done>
</task>
```

## Commit 2 — UI: Test all + badge

```xml
<task type="auto">
  <name>Test all en el editor + badge de salud en la ProductCard</name>
  <files>
    src/app/studio/_components/IntegrationsEditor.tsx,
    src/app/studio/[slug]/page.tsx,
    src/app/studio/[slug]/_components/ClientView.tsx,
    src/app/studio/[slug]/_components/ProductCard.tsx
  </files>
  <action>
    IntegrationsEditor: useStudioSlug(); cabecera con botón "Test all configured" + línea de estado
      (last tested relativo + totales + source). En mount getIntegrationsHealth para poblar.
      "Test all" → runIntegrationsHealth(slug, value); mapa resultsByKind → cada Card recibe
      externalResult opcional pintado en su TestRow. Botones Test por card se mantienen.
    page.tsx: kv.get(kvKeys.integHealth(slug)) → prop initialIntegrationsHealth a ClientView.
    ClientView: recibe prop y lo pasa a la ProductCard de Kiosks (integrationsHealth).
    ProductCard: prop opcional integrationsHealth; línea sutil solo si active && prop
      (healthy/degraded/untested). Solo card Kiosks.
  </action>
  <verify>
    pnpm typecheck && pnpm lint && pnpm validate:configs.
    Las otras 4 cards no cambian (prop opcional ausente).
  </verify>
  <done>
    "Test all" testea la working copy, persiste y distribuye resultados; el hub muestra el badge.
    QA visual del editor lo hace Rubén (login GitHub). Commit + push → deploy READY.
  </done>
</task>
```
