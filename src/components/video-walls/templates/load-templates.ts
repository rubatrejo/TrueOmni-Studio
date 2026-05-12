/**
 * Side-effect entrypoint: importar este archivo registra TODOS los
 * templates video-walls en el `registry` singleton.
 *
 * El SignagePlayer del producto signage hace el mismo patrón con
 * `import '../templates/load-templates'` antes de usar `getTemplate`.
 *
 * VW3..VW8 expanden este registro con los 23 templates pixel-perfect
 * (6 grids 3×2 + 6 grids 4×2 + 5 grids 2×2 + 3 grids 2×1 + 3 grids 1×2).
 */

import './3x2/00-placeholder';
