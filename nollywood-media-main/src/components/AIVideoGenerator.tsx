import { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkles, Play, Download, Loader2, AlertTriangle, Film, Wand2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { checkAIRateLimit, recordAIGeneration, type SubscriptionTier } from '../lib/aiRateLimit';
import {
    generateVideo,
    checkGenerationStatus,
    isAIGenerationAvailable,
    getAvailableProviders,
    type VideoGenerationOptions,
    type GenerationStatus,
    type AIProvider,
} from '../lib/videoGeneration';

interface AIVideoGeneratorProps {
    onSaved?: () => void;
}

const STYLES = [
    { id: 'cinematic', label: 'Cinematic', emoji: '🎬' },
    { id: 'animated', label: 'Animated', emoji: '🎨' },
    { id: 'realistic', label: 'Realistic', emoji: '📸' },
    { id: 'documentary', label: 'Documentary', emoji: '📹' },
] as const;

const DURATIONS = [
    { id: '5s', label: '5 seconds' },
    { id: '10s', label: '10 seconds' },
    { id: '15s', label: '15 seconds' },
] as const;

const ASPECT_RATIOS = [
    { id: '16:9', label: '16:9 (Landscape)' },
    { id: '9:16', label: '9:16 (Portrait)' },
    { id: '1:1', label: '1:1 (Square)' },
] as const;

export function AIVideoGenerator({ onSaved }: AIVideoGeneratorProps) {
    const { user } = useAuth();
    const available = isAIGenerationAvailable();
    const pollRef = useRef<ReturnType<typeof setInterval>>();

    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState<VideoGenerationOptions['style']>('cinematic');
    const [duration, setDuration] = useState<VideoGenerationOptions['duration']>('10s');
    const [aspectRatio, setAspectRatio] = useState<VideoGenerationOptions['aspectRatio']>('16:9');

    const [status, setStatus] = useState<GenerationStatus | null>(null);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeProvider, setActiveProvider] = useState<AIProvider | undefined>();
    const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; limit: number; tier: SubscriptionTier } | null>(null);

    // Check rate limit on mount
    useEffect(() => {
        if (user) {
            checkAIRateLimit(user.id).then(info => {
                setRateLimitInfo({ remaining: info.remaining, limit: info.limit, tier: info.tier });
            });
        }
    }, [user]);

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, []);

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt describing the video you want to create');
            return;
        }

        // Rate limit check
        if (user) {
            const rateCheck = await checkAIRateLimit(user.id);
            if (!rateCheck.allowed) {
                const tierLabel = rateCheck.tier === 'free' ? 'Free' : rateCheck.tier === 'basic' ? 'Basic' : 'Premium';
                setError(`Daily generation limit reached (${rateCheck.limit} video${rateCheck.limit > 1 ? 's' : ''}/day on ${tierLabel} plan). Upgrade your plan for higher limits and an ad-free experience!`);
                return;
            }
        }

        setGenerating(true);
        setError(null);
        setStatus({ state: 'pending', progress: 0 });
        setSaved(false);

        const result = await generateVideo({ prompt, style, duration, aspectRatio });
        setActiveProvider(result.provider as AIProvider | undefined);

        if (!result.success) {
            setError(result.error || 'Generation failed');
            setGenerating(false);
            setStatus(null);
            return;
        }

        if (!result.operationId) {
            setError('No operation ID returned');
            setGenerating(false);
            setStatus(null);
            return;
        }

        // Poll for status
        setStatus({ state: 'processing', progress: 10 });

        pollRef.current = setInterval(async () => {
            const pollStatus = await checkGenerationStatus(result.operationId!, result.provider as AIProvider);
            setStatus(pollStatus);

            if (pollStatus.state === 'completed' || pollStatus.state === 'failed') {
                if (pollRef.current) clearInterval(pollRef.current);
                setGenerating(false);

                if (pollStatus.state === 'failed') {
                    setError(pollStatus.error || 'Video generation failed');
                } else if (pollStatus.state === 'completed' && user) {
                    // Only record usage on actual success
                    recordAIGeneration(user.id);
                    setRateLimitInfo(prev => prev ? { ...prev, remaining: Math.max(0, prev.remaining - 1) } : null);
                }
            }
        }, 5000);
    }, [prompt, style, duration, aspectRatio, user]);

    const handleSaveToUploads = useCallback(async () => {
        if (!user || !status?.videoUrl) return;

        setSaving(true);
        try {
            const { error: dbError } = await supabase
                .from('user_content_uploads')
                .insert({
                    user_id: user.id,
                    title: prompt.slice(0, 100),
                    description: `AI-generated video: ${prompt}`,
                    category: 'Animation',
                    tags: ['ai-generated', style],
                    video_url: status.videoUrl,
                    source: 'ai',
                    status: 'processing',
                    moderation_status: 'pending',
                    visibility: 'private',
                });

            if (dbError) throw dbError;

            setSaved(true);
            onSaved?.();
        } catch (err: any) {
            setError(err.message || 'Failed to save video');
        } finally {
            setSaving(false);
        }
    }, [user, status, prompt, style, onSaved]);

    // API key not configured
    if (!available) {
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                    <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    AI Video Generation
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Create unique videos using AI. Supports Gemini Veo, Seedance, and Leonardo.
                </p>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 inline-block">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">API Key Required</span>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        Set <code className="bg-amber-200/50 dark:bg-amber-800/50 px-1 rounded">VITE_GEMINI_API_KEY</code> in <code className="bg-amber-200/50 dark:bg-amber-800/50 px-1 rounded">.env.local</code> to enable.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                    AI Video Generator
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Describe your scene and let AI create it. Powered by {getAvailableProviders().join(', ')}.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-6">
                {/* Prompt */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Wand2 className="inline w-4 h-4 mr-1" />
                        Describe Your Video
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={4}
                        maxLength={500}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
                        placeholder="Example: A bustling Lagos market scene at sunset with colorful fabrics, market women selling goods, and golden sunlight filtering through the stalls..."
                        disabled={generating}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {prompt.length}/500 characters — Be descriptive for best results
                    </p>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Style */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Style
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {STYLES.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => setStyle(s.id)}
                                    disabled={generating}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${style === s.id
                                        ? 'bg-purple-600 text-white ring-2 ring-purple-600 ring-offset-2 dark:ring-offset-gray-800'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    {s.emoji} {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Duration
                        </label>
                        <select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value as VideoGenerationOptions['duration'])}
                            disabled={generating}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500"
                        >
                            {DURATIONS.map((d) => (
                                <option key={d.id} value={d.id}>{d.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Aspect Ratio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Aspect Ratio
                        </label>
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value as VideoGenerationOptions['aspectRatio'])}
                            disabled={generating}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500"
                        >
                            {ASPECT_RATIOS.map((ar) => (
                                <option key={ar.id} value={ar.id}>{ar.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-600 dark:text-red-400 flex-1">{error}</p>
                    </div>
                )}

                {/* Generation Progress */}
                {status && status.state !== 'completed' && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 text-center">
                        <Loader2 className="h-10 w-10 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-3" />
                        <p className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                            {status.state === 'pending' ? 'Starting generation...' : 'Creating your video...'}
                        </p>
                        {status.progress !== undefined && (
                            <div className="w-full max-w-xs mx-auto bg-purple-200 dark:bg-purple-800 rounded-full h-2 mt-3">
                                <div
                                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${status.progress}%` }}
                                />
                            </div>
                        )}
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-2">
                            This may take 1-3 minutes. Please don't close this page.
                        </p>
                    </div>
                )}

                {/* Video Preview */}
                {status?.state === 'completed' && status.videoUrl && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        <video
                            src={status.videoUrl}
                            controls
                            className="w-full aspect-video bg-black"
                            autoPlay
                            muted
                        />
                        <div className="p-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50">
                            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                                <Film className="h-5 w-5" />
                                <span className="font-medium text-sm">Video generated successfully!</span>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={status.videoUrl}
                                    download
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
                                >
                                    <Download className="h-4 w-4" />
                                    Download
                                </a>
                                <button
                                    onClick={handleSaveToUploads}
                                    disabled={saving || saved}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${saved
                                        ? 'bg-green-600 text-white'
                                        : 'bg-red-600 hover:bg-red-700 text-white'
                                        } disabled:opacity-50`}
                                >
                                    {saving ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : saved ? (
                                        '✓ Saved to My Uploads'
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4" />
                                            Save to My Uploads
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Generate Button */}
                {(!status || status.state === 'completed' || status.state === 'failed') && (
                    <div>
                        <button
                            onClick={handleGenerate}
                            disabled={generating || !prompt.trim()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25"
                        >
                            <Sparkles className="h-5 w-5" />
                            {status?.state === 'completed' ? 'Generate Another' : 'Generate Video'}
                        </button>
                        {rateLimitInfo && rateLimitInfo.limit !== Infinity && (
                            <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">
                                {rateLimitInfo.remaining} of {rateLimitInfo.limit} generation{rateLimitInfo.limit > 1 ? 's' : ''} remaining today
                                <span className="ml-1 text-purple-500">({rateLimitInfo.tier} plan)</span>
                                {activeProvider && <span className="ml-1">· Provider: {activeProvider}</span>}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
