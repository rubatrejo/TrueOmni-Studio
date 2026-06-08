'use client';

import type { ComponentProps } from 'react';

import type { PwaSocialWallModuleConfig } from '@/lib/config';

import { usePwaSection } from './pwa-bridge-context';
import { SocialWallScreen } from './social-wall/social-wall-screen';

type SocialWallData = Omit<ComponentProps<typeof SocialWallScreen>, 'texts'>;

/**
 * Wrapper live del Social Wall. Lee el override de `features.pwa.socialWall` y
 * sustituye solo los textos (title, allLabel, highlightsLabel); el muro (posts,
 * handles, hashtag, highlights) viene del server. No toca `SocialWallScreen`.
 */
export function SocialWallScreenLive({
  config,
  ...data
}: SocialWallData & {
  config: PwaSocialWallModuleConfig;
}) {
  const cfg = usePwaSection('socialWall', config) ?? config;
  return <SocialWallScreen {...data} texts={cfg} />;
}
