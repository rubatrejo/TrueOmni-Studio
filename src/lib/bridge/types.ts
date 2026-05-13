/**
 * Types compartidos entre los bridges signage y video-walls.
 *
 * Antes vivían duplicados:
 *   - `SignageBridgeStatus` en `src/app/studio/digital-displays/_lib/use-signage-bridge.ts`
 *   - `VideoWallBridgeStatus` en `src/lib/video-walls/bridge.ts`
 *
 * Ambos son la misma union de strings (`'connecting' | 'connected' | 'stale'
 * | 'lost'`), pero al ser nominalmente distintos TypeScript marcaba como
 * error cualquier intento de pasar uno donde se esperaba el otro
 * (concretamente el `<SignageSidebarTabs bridgeStatus={...}>` reusado por
 * el `WallEditorShell` del producto Video Walls).
 *
 * Centralizar el type aquí permite que ambos productos reusen el mismo
 * sidebar/diagnostics y que cualquier futura paleta (e.g. `'reconnecting'`)
 * se añada en un único sitio.
 */
export type BridgeStatus = 'connecting' | 'connected' | 'stale' | 'lost';
