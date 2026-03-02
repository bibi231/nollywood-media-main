import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';

interface AdUnit {
    id: string;
    campaign_id: string;
    content_url: string;
    destination_url: string;
    alt_text: string;
    type: string;
}

export function AdBanner({ category, className, format }: { category?: string, className?: string, format?: string }) {
    // format is passed from AdSpace (e.g., 'leaderboard', 'rectangle')
    // We could use it to filter ads by type if we wanted
    const [ad, setAd] = useState<AdUnit | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdSenseFallback, setIsAdSenseFallback] = useState(false);

    useEffect(() => {
        const loadAd = async () => {
            try {
                setLoading(true);
                setIsAdSenseFallback(false); // Reset fallback state
                setAd(null); // Clear previous ad

                const response = await fetch(`/api/ads/serve?type=${format || 'banner'}&category=${category || ''}`);
                const result = await response.json();

                if (result.data) {
                    setAd(result.data);
                } else {
                    console.log('No native ads found, falling back to Google AdSense');
                    setIsAdSenseFallback(true);
                }
            } catch (error) {
                console.error('Error fetching native ad:', error);
                setIsAdSenseFallback(true);
            } finally {
                setLoading(false);
            }
        };

        loadAd();
    }, [category, format]);

    const logEvent = async (adUnitId: string, campaignId: string, eventType: 'impression' | 'click') => {
        try {
            await fetch('/api/ads/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ad_unit_id: adUnitId,
                    campaign_id: campaignId,
                    event_type: eventType
                })
            });
        } catch (err) {
            console.error('Failed to log ad event:', err);
        }
    };

    const handleClick = () => {
        if (ad) {
            logEvent(ad.id, ad.campaign_id, 'click');
            window.open(ad.destination_url, '_blank', 'noopener,noreferrer');
        }
    };

    if (loading) return (
        <div className={`animate-pulse bg-slate-900/40 border border-white/5 rounded-xl ${className}`}>
            <div className="h-full w-full flex items-center justify-center text-[10px] text-slate-700 font-bold uppercase tracking-widest min-h-[100px]">
                Loading Ad...
            </div>
        </div>
    );

    if (isAdSenseFallback || !ad) {
        return (
            <div className={`ad-sense-container flex items-center justify-center bg-black/20 border border-white/5 overflow-hidden rounded-xl relative min-h-[100px] ${className || ''}`}>
                <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest absolute top-1 right-2">Sponsored (Google)</div>
                <div className="p-4 text-center">
                    <p className="text-xs text-slate-400 font-bold italic">Google Adsense Backfill</p>
                    <p className="text-[10px] text-slate-600">Category: {category || 'General'}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`w-full bg-gray-50 dark:bg-gray-800/50 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 group relative ${className || ''}`}>
            <button
                onClick={handleClick}
                className="w-full flex flex-col md:flex-row items-center gap-6 p-4 md:p-6 text-left"
            >
                <div className="w-full md:w-48 h-24 bg-gray-200 dark:bg-gray-700 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                        src={ad.content_url}
                        alt={ad.alt_text}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>

                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded">Sponsored</span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{ad.alt_text}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">Click to learn more about this offer from our partner.</p>
                </div>

                <div className="hidden md:flex items-center gap-2 text-gray-400 group-hover:text-red-600 transition-colors">
                    <span className="text-xs font-bold uppercase tracking-widest">Visit Site</span>
                    <ExternalLink className="w-4 h-4" />
                </div>
            </button>
        </div>
    );
}
