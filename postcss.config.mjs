/**
 * PostCSS config. `postcss-import` es crítico porque globals.css hace
 * `@import "../../clients/_template/tokens.css"` y necesitamos que se
 * resuelva en build-time (no como @import runtime del navegador).
 */
export default {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
