import { useEffect, useRef } from 'react';
import { useAdsConfig } from '../../hooks/useAdsConfig';

type AdFormat = 'leaderboard' | 'rectangle' | 'sidebar' | 'responsive';

interface AdBannerProps {
    /** AdSense ad slot ID */
    slot?: string;
    /** Display format */
    format?: AdFormat;
    /** Additional CSS classes */
    className?: string;
}

const FORMAT_STYLES: Record<AdFormat, { width: string; height: string; label: string }> = {
    leaderboard: { width: '100%', height: '90px', label: '728×90 Leaderboard' },
    rectangle: { width: '336px', height: '280px', label: '336×280 Rectangle' },
    sidebar: { width: '300px', height: '250px', label: '300×250 Sidebar' },
    responsive: { width: '100%', height: '100px', label: 'Responsive' },
};

declare global {
    interface Window {
        adsbygoogle: Array<Record<string, unknown>>;
    }
}

export function AdBanner({ slot, format = 'responsive', className = '' }: AdBannerProps) {
    const { adsEnabled, pubId, showPlaceholders } = useAdsConfig();
    const adRef = useRef<HTMLModElement>(null);
    const pushed = useRef(false);

    useEffect(() => {
        if (!adsEnabled || !slot || pushed.current) return;

        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            pushed.current = true;
        } catch (err) {
            console.error('AdSense push error:', err);
        }
    }, [adsEnabled, slot]);

    const style = FORMAT_STYLES[format];

    // Production without credentials: render nothing
    if (!adsEnabled && !showPlaceholders) return null;

    // Dev mode placeholder
    if (showPlaceholders) {
        return (
            <div
                className={`flex items-center justify-center border-2 border-dashed border-gray-600 rounded-lg bg-gray-800/30 text-gray-500 text-xs font-mono select-none ${className}`}
                style={{ width: style.width, height: style.height, maxWidth: '100%' }}
            >
                <div className="text-center">
                    <div className="mb-1 opacity-60">📢 Ad Placeholder</div>
                    <div>{style.label}</div>
                </div>
            </div>
        );
    }

    // Real AdSense unit
    return (
        <div className={className}>
            <ins
                ref={adRef}
                className="adsbygoogle"
                style={{
                    display: 'block',
                    width: format === 'responsive' ? '100%' : style.width,
                    height: format === 'responsive' ? 'auto' : style.height,
                }}
                data-ad-client={pubId}
                data-ad-slot={slot}
                data-ad-format={format === 'responsive' ? 'auto' : undefined}
                data-full-width-responsive={format === 'responsive' ? 'true' : undefined}
            />
        </div>
    );
}
