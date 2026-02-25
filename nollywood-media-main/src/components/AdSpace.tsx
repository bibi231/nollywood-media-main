import { AdBanner } from './ads/AdBanner';
import { useAdsConfig } from '../hooks/useAdsConfig';

interface AdSpaceProps {
  variant?: 'banner' | 'rectangle' | 'leaderboard' | 'sidebar';
  /** Optional AdSense ad slot ID — if provided, renders a real ad unit */
  slot?: string;
  className?: string;
}

const VARIANT_TO_FORMAT = {
  banner: 'leaderboard',
  rectangle: 'rectangle',
  leaderboard: 'leaderboard',
  sidebar: 'sidebar',
} as const;

/**
 * Unified ad placement component.
 * Delegates to AdBanner for real ad rendering when credentials are set.
 * Falls back to placeholder in dev mode.
 */
export function AdSpace({ variant = 'banner', slot, className = '' }: AdSpaceProps) {
  const { adsEnabled, showPlaceholders } = useAdsConfig();

  // If ads are enabled or we're showing dev placeholders, use AdBanner
  if (adsEnabled || showPlaceholders) {
    return (
      <AdBanner
        slot={slot}
        format={VARIANT_TO_FORMAT[variant]}
        className={className}
      />
    );
  }

  // Production without credentials: render nothing (no empty placeholders)
  return null;
}
