/**
 * [FASE 1 PLACEHOLDER]
 *
 * Textos temporales que existen SOLO para verificar que el scaffolding levanta.
 * Se ELIMINAN en Fase 2 cuando exista clients/default/config.json y
 * src/lib/config.ts (R4). A partir de entonces los textos vendrán de
 * `config.textos` del cliente activo.
 *
 * Este archivo es el único lugar del repo donde se permiten strings de UI
 * hardcoded durante Fase 1. El subagent `auditor-white-label` lo ignora
 * mientras exista este comentario de cabecera.
 */

export const KIOSK_PHASE_1_PLACEHOLDER = {
  titulo: 'Scaffolding kiosk listo',
  subtitulo: 'Fase 1 — pendiente conectar a config de cliente',
  nota: 'Este texto se reemplaza por config.textos en Fase 2.',
  labelClienteActivo: 'Cliente activo:',
} as const;
