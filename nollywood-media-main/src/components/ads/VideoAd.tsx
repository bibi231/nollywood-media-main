import { useEffect, useState, useRef } from 'react';

interface AdUnit {
    id: string;
    campaign_id: string;
    content_url: string;
    destination_url: string;
    alt_text: string;
    type: string;
}

interface VideoAdProps {
    category?: string;
    onComplete: () => void;
}

export function VideoAd({ category, onComplete }: VideoAdProps) {
    const [ad, setAd] = useState<AdUnit | null>(null);
    const [loading, setLoading] = useState(true);
    const [canSkip, setCanSkip] = useState(false);
    const [skipTimer, setSkipTimer] = useState(5);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        fetchAd();
    }, [category]);

    useEffect(() => {
        if (ad && !canSkip) {
            const interval = setInterval(() => {
                setSkipTimer((prev) => {
                    if (prev <= 1) {
                        setCanSkip(true);
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [ad, canSkip]);

    const fetchAd = async () => {
        try {
            const query = category ? `&category=${encodeURIComponent(category)}` : '';
            const res = await fetch(`/api/ads/serve?type=video_preroll${query}`);
            const result = await res.json();

            if (result.data) {
                setAd(result.data);
                logEvent(result.data.id, result.data.campaign_id, 'impression');
            } else {
                onComplete(); // Skip if no ad
            }
        } catch (err) {
            console.error('Failed to load video ad:', err);
            onComplete();
        } finally {
            setLoading(false);
        }
    };

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

    if (loading) return null;
    if (!ad) return null;

    return (
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
            <video
                ref={videoRef}
                src={ad.content_url}
                autoPlay
                playsInline
                onEnded={onComplete}
                className="w-full h-full object-contain"
            />

            {/* Overlay controls */}
            <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
                <div className="flex justify-between items-start">
                    <span className="bg-black/60 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-white px-3 py-1.5 rounded-lg border border-white/10">
                        Sponsored Ad
                    </span>

                    <button
                        onClick={onComplete}
                        disabled={!canSkip}
                        className={`pointer-events-auto px-6 py-2.5 rounded-xl font-bold transition-all border ${canSkip
                                ? 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                                : 'bg-black/40 text-gray-400 border-transparent'
                            }`}
                    >
                        {canSkip ? 'Skip Ad' : `Skip in ${skipTimer}s`}
                    </button>
                </div>

                <div className="flex justify-between items-end">
                    <button
                        onClick={handleClick}
                        className="pointer-events-auto bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95"
                    >
                        Visit Website
                    </button>
                </div>
            </div>
        </div>
    );
}
