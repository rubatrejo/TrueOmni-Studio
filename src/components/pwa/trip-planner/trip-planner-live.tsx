'use client';

import type { ComponentProps } from 'react';

import { usePwaSection } from '../pwa-bridge-context';

import { TripPlannerScreen } from './trip-planner-screen';

/**
 * Wrapper live del Trip Planner: aplica el override de `features.pwa.tripPlanner`
 * que empuja el editor PWA del Studio (preview en vivo de los textos mobile) y
 * cae al `tp` del server fuera del Studio. No toca `TripPlannerScreen`.
 *
 * Los labels derivados de categorías (computados en el server) no se recalculan
 * en vivo; los textos directos del `tp` (welcome, toggle, My Plan, AI) sí.
 */
export function TripPlannerLive(props: ComponentProps<typeof TripPlannerScreen>) {
  const tp = usePwaSection('tripPlanner', props.tp) ?? props.tp;
  return <TripPlannerScreen {...props} tp={tp} />;
}
