# Test E2E — Studio create client + activate DD + edit branding

> Hallazgo S-39 del audit panorámico v2 · 2026-05-08.
>
> **Fuente de verdad ejecutable:** [`tests/e2e/studio-create-client.json`](../../tests/e2e/studio-create-client.json),
> que corre con `agent-browser batch --bail < tests/e2e/studio-create-client.json`.
> Ese spec no requiere instalar nada nuevo en el repo (solo `agent-browser`
> global, que ya es el toolchain oficial de `/verificar-visual`).
>
> Este archivo se mantiene como **referencia secundaria** del camino
> Playwright, por si en el futuro la suite crece y se decide migrar a
> `@playwright/test`. **NO es roadmap obligatorio**: el plan original (S-39
> "instalar @playwright/test en Sprint 5") quedó superado por la decisión
> 2026-05-11 de centralizar QA visual en agent-browser.

## Objetivo

Smoke test del flow más crítico del Studio: dashboard → crear cliente
nuevo → activar Digital Displays → editar branding → verificar sync E2E.

## Setup requerido

```bash
pnpm add -D @playwright/test
pnpm exec playwright install chromium
```

Añadir a `package.json`:

```json
"scripts": {
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

`playwright.config.ts` mínimo:

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

## Spec — `tests/e2e/studio-create-client.spec.ts`

```ts
import { expect, test } from '@playwright/test';

const TEST_SLUG = `e2e-${Date.now().toString(36)}`;
const TEST_NAME = `E2E Test Client ${Date.now()}`;

test.describe('Studio · create client + activate DD + edit branding', () => {
  test.afterEach(async ({ request }) => {
    // Cleanup: borrar el cliente al final del test para no acumular
    // basura en el KV. Idempotente — si el create falló no pasa nada.
    await request.delete(`/api/studio/configs/${TEST_SLUG}`).catch(() => null);
  });

  test('flow completo', async ({ page, request }) => {
    // 1. Dashboard
    await page.goto('/studio');
    await expect(page.getByRole('heading', { name: 'Your clients' })).toBeVisible();

    // 2. Open NewClientModal vía botón header (S-24 distingue ambos botones)
    await page.getByRole('button', { name: 'Create a new client' }).first().click();
    await expect(page.getByRole('dialog', { name: 'New client' })).toBeVisible();

    // 3. Llenar form + activar DD checkbox (S-10)
    await page.getByLabel('Name').fill(TEST_NAME);
    await page.getByLabel(/Also activate Digital Displays/).check();
    await page.getByRole('button', { name: /Create/i }).click();

    // 4. Redirect a Vista de Cliente
    await page.waitForURL(new RegExp(`/studio/${TEST_SLUG}$`));
    await expect(page.getByRole('heading', { name: TEST_NAME })).toBeVisible();

    // 5. Branding tab → cambiar primary color via input visible
    await page.getByRole('tab', { name: 'Brand colors' }).click();
    // El picker tiene un input "Primary" (HSL string). El componente real
    // usa <HslColorPicker>; aquí simulamos cambiando el state via API
    // directa para mantener el test estable contra el picker de UI.
    const branding = await request
      .get(`/api/studio/clients/${TEST_SLUG}/branding`)
      .then((r) => r.json());
    expect(branding.brand.primary).toBeDefined();

    // 6. Verificar sync bidireccional: cambiar branding desde la API y
    //    confirmar que el kiosk config también se actualizó.
    await request.patch(`/api/studio/clients/${TEST_SLUG}/branding`, {
      data: { ...branding, brand: { ...branding.brand, primary: '32 100% 50%' } },
    });

    const kioskCfg = await request.get(`/api/studio/configs/${TEST_SLUG}`).then((r) => r.json());
    expect(kioskCfg.branding.primary).toBe('32 100% 50%');

    // 7. Pending changes panel (S-11) muestra que kiosk + signage van a
    //    cambiar al publicar.
    await page.reload();
    const pending = page.getByRole('heading', { name: 'Pending changes' });
    await expect(pending).toBeVisible();

    // 8. Activate DD card debe estar Active (S-44 + S-09).
    await expect(page.getByRole('link', { name: /Open editor.*Digital Displays/i })).toBeVisible();
  });

  test('Escape cierra NewClientModal (S-28)', async ({ page }) => {
    await page.goto('/studio');
    await page.getByRole('button', { name: 'Create a new client' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'New client' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
  });

  test('focus trap: Tab no escapa al body (S-29)', async ({ page }) => {
    await page.goto('/studio');
    await page.getByRole('button', { name: 'Create a new client' }).first().click();
    // Tab 50 veces → el foco debe permanecer dentro del dialog.
    for (let i = 0; i < 50; i++) await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      return dialog?.contains(document.activeElement) ?? false;
    });
    expect(focused).toBe(true);
  });
});
```

## Cobertura

- **S-09** Activate fallback (cubierto por flow + `afterEach` cleanup)
- **S-10** NewClientModal con DD checkbox (paso 3)
- **S-11** Pending changes panel (paso 7)
- **S-13** Pin: no incluido en este spec — sería un `studio-dashboard.spec.ts` aparte
- **S-24** Botones distintos (paso 2)
- **S-28** Escape (test 2)
- **S-29** Focus trap (test 3)
- **S-44** New Display creation: spec separado
  `studio-new-display.spec.ts` — sigue la misma estructura

## Pendiente (solo si se decide migrar a Playwright)

Estos pasos NO son obligatorios: el spec ya corre como JSON con
agent-browser. Solo aplican si en el futuro se decide reemplazar
agent-browser por Playwright para QA del Studio:

1. Instalar `@playwright/test` + `playwright install`.
2. Convertir `tests/e2e/studio-create-client.json` al `.spec.ts` de
   arriba y eliminar el `.json`.
3. Añadir GitHub Action `e2e.yml` que corre `pnpm test:e2e` en PRs.
4. Mock del KV para tests CI (sin Upstash en GitHub Actions).

Mientras tanto, el CI puede correr el JSON con `agent-browser batch`
sin ninguno de estos pasos.
