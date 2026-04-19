/**
 * ESLint estricto para el kiosk.
 * - next/core-web-vitals: reglas recomendadas para App Router.
 * - @typescript-eslint/recommended: reglas TS base.
 * - jsx-a11y/recommended: accesibilidad mínima AA (requisito de las pantallas).
 * - prettier al final: apaga reglas de formato que entren en conflicto.
 *
 * La regla `no-restricted-imports` fuerza que el resto del proyecto importe
 * desde los wrappers de `src/components/*` y no directamente desde
 * `src/components/ui/*` (CLAUDE.md §8). Los wrappers y los propios `ui/*`
 * quedan exentos.
 */
module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': 'error',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      },
    ],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'jsx-a11y/alt-text': 'error',
    'react/jsx-no-target-blank': 'error',
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['@/components/ui/*'],
            message:
              'Importa desde @/components/{nombre} (wrapper), no desde @/components/ui/* (CLAUDE.md §8).',
          },
        ],
      },
    ],
  },
  overrides: [
    {
      // Wrappers: tienen permitido importar directamente shadcn/ui para re-exportar.
      files: ['src/components/*.{ts,tsx}'],
      rules: { 'no-restricted-imports': 'off' },
    },
    {
      // Componentes generados por shadcn: no editar a mano, relajar reglas específicas.
      files: ['src/components/ui/**'],
      rules: {
        'react/display-name': 'off',
        'no-restricted-imports': 'off',
      },
    },
    {
      // Archivos de configuración pueden usar default export.
      files: ['*.config.{ts,js,mjs,cjs}'],
      rules: { 'import/no-default-export': 'off' },
    },
  ],
};
