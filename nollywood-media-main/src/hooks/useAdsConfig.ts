import { useAuth } from '../context/AuthContext';

/**
 * Ads configuration hook
 * Reads environment variables and provides ad system state
 */
export function useAdsConfig() {
    const pubId = import.meta.env.VITE_ADSENSE_PUB_ID as string | undefined;
    const imaTagUrl = import.meta.env.VITE_IMA_AD_TAG_URL as string | undefined;
    const { tier } = useAuth();
    const isDev = import.meta.env.DEV;

    const isPaidTier = tier && tier !== 'free';

    return {
        adsEnabled: !!pubId && !isPaidTier,
        pubId: pubId || '',
        imaTagUrl: imaTagUrl || '',
        /** Show placeholder blocks in dev mode when no credentials */
        showPlaceholders: isDev && !pubId && !isPaidTier,
    };
}
