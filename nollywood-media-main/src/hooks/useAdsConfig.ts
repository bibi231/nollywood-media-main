/**
 * Ads configuration hook
 * Reads environment variables and provides ad system state
 */
export function useAdsConfig() {
    const pubId = import.meta.env.VITE_ADSENSE_PUB_ID as string | undefined;
    const imaTagUrl = import.meta.env.VITE_IMA_AD_TAG_URL as string | undefined;
    const isDev = import.meta.env.DEV;

    return {
        adsEnabled: !!pubId,
        pubId: pubId || '',
        imaTagUrl: imaTagUrl || '',
        /** Show placeholder blocks in dev mode when no credentials */
        showPlaceholders: isDev && !pubId,
    };
}
