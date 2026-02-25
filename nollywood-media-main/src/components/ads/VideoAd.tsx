import { useEffect, useRef, useState, useCallback } from 'react';
import { useAdsConfig } from '../../hooks/useAdsConfig';

interface VideoAdProps {
    /** Pre-roll or post-roll */
    type: 'pre' | 'post';
    /** Callback when ad completes or is skipped */
    onAdComplete: () => void;
    /** Callback if ad fails to load */
    onAdError?: () => void;
}

/**
 * IMA SDK video ad wrapper.
 * Shows a skippable pre-roll or post-roll ad before/after content.
 * Falls back gracefully when IMA credentials aren't set.
 */
export function VideoAd({ type, onAdComplete, onAdError }: VideoAdProps) {
    const { imaTagUrl, showPlaceholders } = useAdsConfig();
    const containerRef = useRef<HTMLDivElement>(null);
    const [countdown, setCountdown] = useState(5);
    const [canSkip, setCanSkip] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval>>();

    const handleSkip = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        onAdComplete();
    }, [onAdComplete]);

    // If no IMA tag, skip immediately
    useEffect(() => {
        if (!imaTagUrl && !showPlaceholders) {
            onAdComplete();
        }
    }, [imaTagUrl, showPlaceholders, onAdComplete]);

    // Dev placeholder countdown
    useEffect(() => {
        if (!showPlaceholders || imaTagUrl) return;

        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    setCanSkip(true);
                    if (timerRef.current) clearInterval(timerRef.current);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [showPlaceholders, imaTagUrl]);

    // Real IMA SDK integration
    useEffect(() => {
        if (!imaTagUrl || !containerRef.current) return;

        // Load IMA SDK script dynamically
        const scriptId = 'ima-sdk-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js';
            script.async = true;
            script.onload = () => initIMA();
            script.onerror = () => {
                console.error('Failed to load IMA SDK');
                onAdError?.();
                onAdComplete();
            };
            document.head.appendChild(script);
        } else {
            initIMA();
        }

        function initIMA() {
            try {
                const google = (window as any).google;
                if (!google?.ima) {
                    onAdComplete();
                    return;
                }

                const adDisplayContainer = new google.ima.AdDisplayContainer(
                    containerRef.current!
                );
                adDisplayContainer.initialize();

                const adsLoader = new google.ima.AdsLoader(adDisplayContainer);

                adsLoader.addEventListener(
                    google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
                    (event: any) => {
                        const adsManager = event.getAdsManager(containerRef.current!);
                        adsManager.addEventListener(
                            google.ima.AdEvent.Type.COMPLETE,
                            () => onAdComplete()
                        );
                        adsManager.addEventListener(
                            google.ima.AdEvent.Type.SKIPPED,
                            () => onAdComplete()
                        );
                        adsManager.addEventListener(
                            google.ima.AdErrorEvent.Type.AD_ERROR,
                            () => {
                                onAdError?.();
                                onAdComplete();
                            }
                        );

                        try {
                            adsManager.init('100%', '100%', google.ima.ViewMode.NORMAL);
                            adsManager.start();
                        } catch {
                            onAdComplete();
                        }
                    }
                );

                adsLoader.addEventListener(
                    google.ima.AdErrorEvent.Type.AD_ERROR,
                    () => {
                        onAdError?.();
                        onAdComplete();
                    }
                );

                const adsRequest = new google.ima.AdsRequest();
                adsRequest.adTagUrl = imaTagUrl;

                adsLoader.requestAds(adsRequest);
            } catch {
                onAdComplete();
            }
        }
    }, [imaTagUrl, onAdComplete, onAdError]);

    // Nothing to show in production without credentials
    if (!imaTagUrl && !showPlaceholders) return null;

    // Dev placeholder
    if (showPlaceholders && !imaTagUrl) {
        return (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
                <div className="text-center">
                    <div className="text-gray-400 text-sm font-mono mb-2">
                        📹 {type === 'pre' ? 'Pre-Roll' : 'Post-Roll'} Video Ad
                    </div>
                    <div className="text-gray-500 text-xs mb-6">
                        IMA SDK placeholder — set VITE_IMA_AD_TAG_URL to activate
                    </div>

                    <div className="w-64 h-36 mx-auto mb-6 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center">
                        <div className="text-4xl opacity-30">▶️</div>
                    </div>

                    {canSkip ? (
                        <button
                            onClick={handleSkip}
                            className="px-6 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Skip Ad →
                        </button>
                    ) : (
                        <div className="text-gray-400 text-sm">
                            Skip in {countdown}s...
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Real IMA SDK container
    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-50 bg-black"
            style={{ width: '100%', height: '100%' }}
        />
    );
}
