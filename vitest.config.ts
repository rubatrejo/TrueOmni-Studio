import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

/**
 * Config de Vitest del proyecto (F-QA-6 del audit). Arranca la red de tests
 * unitarios, hoy inexistente. Cubre lógica pura del Studio (schemas Zod,
 * bootstrap del cliente nuevo).
 *
 * - `environment: 'node'`: lo que testeamos es lógica de servidor/pura, sin DOM.
 * - `resolve.tsconfigPaths`: resuelve los alias `@/*` del tsconfig nativamente
 *   (Vite/Vitest 4+, sin plugin externo).
 * - alias `server-only` → stub vacío: módulos como `bootstrap-from-fs` importan
 *   `server-only`, que lanza fuera de un RSC; en tests lo neutralizamos.
 */
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      'server-only': resolve(__dirname, 'test/stubs/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
  },
});
