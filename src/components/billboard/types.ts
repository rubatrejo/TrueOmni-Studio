/** Props compartidas de las variantes del Billboard idle (B0–B4). */
export interface BillboardVariantProps {
  /**
   * Estado inicial del módulo Languages (`features.languages.enabled` del
   * runtime), pasado desde el server. Si es `false`, el idle oculta el selector
   * de idioma y, en las variantes 2/3/4, pone el "Powered by" en su lugar. El
   * preview del Studio lo sobreescribe en vivo vía evento.
   */
  languagesEnabled?: boolean;
}
