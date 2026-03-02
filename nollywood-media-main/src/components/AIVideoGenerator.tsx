import { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkles, Play, Download, Loader2, AlertTriangle, Film, Wand2, Zap, History, Layout, Clock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    { id: 'cinematic', label: 'Cinematic', emoji: '🎬', description: 'High-end film look' },
    { id: 'animated', label: 'Animated', emoji: '🎨', description: 'Vibrant 3D/2D animation' },
    { id: 'realistic', label: 'Realistic', emoji: '📸', description: 'Photorealistic textures' },
    { id: 'documentary', label: 'Documentary', emoji: '📹', description: 'Raw, hand-held feel' },
] as const;

const DURATIONS = [
    { id: '5s', label: '5s', info: 'Draft' },
    { id: '10s', label: '10s', info: 'Standard' },
    { id: '15s', label: '15s', info: 'Extended' },
] as const;

const ASPECT_RATIOS = [
    { id: '16:9', label: 'Landscape', info: '16:9' },
    { id: '9:16', label: 'Portrait', info: '9:16' },
    { id: '1:1', label: 'Square', info: '1:1' },
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

    useEffect(() => {
        if (user) {
            checkAIRateLimit(user.id).then(info => {
                setRateLimitInfo({ remaining: info.remaining, limit: info.limit, tier: info.tier });
            });
        }
    }, [user]);

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

        if (user) {
            const rateCheck = await checkAIRateLimit(user.id);
            if (!rateCheck.allowed) {
                setError(`Generation limit reached. Upgrade for more creations.`);
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
                    tags: ['ai-generated', style].filter(Boolean),
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

    if (!available) {
        return (
            <div className="max-w-2xl mx-auto text-center py-20 px-6 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/10 border border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                    <Sparkles className="h-10 w-10 text-purple-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">AI Video Studio</h2>
                <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                    Set your API keys to unlock the power of Gemini Veo and Leonardo AI for cinematic creation.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
                    <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-bold tracking-wide uppercase text-xs">Environment Check Required</span>
                    </div>
                    <p className="text-xs text-amber-200/70">
                        Please configure <code className="bg-amber-500/20 px-2 py-0.5 rounded text-amber-300">VITE_GEMINI_API_KEY</code> to proceed.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10 text-center"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold uppercase tracking-widest mb-4">
                    <Zap className="w-3 h-3" /> AI Video Engine 2.0
                </div>
                <h2 className="text-4xl font-extrabold text-white mb-3 tracking-tighter">
                    Cinematic <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-red-400">Creation Studio</span>
                </h2>
                <p className="text-slate-400 max-w-xl mx-auto">
                    Turn your imagination into high-fidelity visuals. Powered by {getAvailableProviders().join(' & ')}.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-7 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Wand2 className="w-32 h-32 text-purple-500" />
                        </div>

                        <div className="relative">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-4 tracking-wide uppercase">
                                <Zap className="w-4 h-4 text-purple-400" /> Intent Description
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={5}
                                maxLength={500}
                                className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-slate-600 resize-none transition-all shadow-inner"
                                placeholder="Describe the atmosphere, camera movement, and subject..."
                                disabled={generating}
                            />
                            <div className="flex justify-between mt-3 px-1">
                                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Token Usage Optimized</span>
                                <span className="text-[10px] text-slate-400 font-bold">{prompt.length}/500</span>
                            </div>
                        </div>

                        <div className="mt-8 space-y-6">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-4 tracking-wide uppercase">
                                    <Layout className="w-4 h-4 text-pink-400" /> Visual Aesthetic
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {STYLES.map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => setStyle(s.id)}
                                            disabled={generating}
                                            className={`relative flex flex-col items-start p-4 rounded-2xl border transition-all ${style === s.id
                                                ? 'bg-purple-500/10 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.15)]'
                                                : 'bg-black/20 border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            <span className="text-xl mb-1">{s.emoji}</span>
                                            <span className={`text-sm font-bold ${style === s.id ? 'text-white' : 'text-slate-400'}`}>{s.label}</span>
                                            <span className="text-[10px] text-slate-500 mt-1 line-clamp-1">{s.description}</span>
                                            {style === s.id && <motion.div layoutId="style-active" className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-4 tracking-wide uppercase">
                                        <Clock className="w-4 h-4 text-blue-400" /> Duration
                                    </label>
                                    <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                                        {DURATIONS.map((d) => (
                                            <button
                                                key={d.id}
                                                onClick={() => setDuration(d.id)}
                                                disabled={generating}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${duration === d.id
                                                    ? 'bg-blue-600 text-white shadow-lg'
                                                    : 'text-slate-500 hover:text-slate-300'
                                                    }`}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-4 tracking-wide uppercase">
                                        <Layout className="w-4 h-4 text-green-400" /> Framing
                                    </label>
                                    <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5">
                                        {ASPECT_RATIOS.map((ar) => (
                                            <button
                                                key={ar.id}
                                                onClick={() => setAspectRatio(ar.id)}
                                                disabled={generating}
                                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${aspectRatio === ar.id
                                                    ? 'bg-green-600 text-white shadow-lg'
                                                    : 'text-slate-500 hover:text-slate-300'
                                                    }`}
                                            >
                                                {ar.info}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-10">
                            <button
                                onClick={handleGenerate}
                                disabled={generating || !prompt.trim()}
                                className="w-full relative group overflow-hidden px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from),_transparent)] opacity-0 group-hover:opacity-20 transition-opacity" />
                                <div className="flex items-center justify-center gap-3 relative">
                                    {generating ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-6 h-6" />
                                    )}
                                    {generating ? 'Processing Request...' : status?.state === 'completed' ? 'Generate Variation' : 'Prime Engine & Create'}
                                </div>
                            </button>

                            {rateLimitInfo && (
                                <div className="mt-4 flex items-center justify-between text-[10px] font-bold tracking-widest uppercase text-slate-500">
                                    <span>Plan: <span className="text-purple-400">{rateLimitInfo.tier}</span></span>
                                    <span>Quota: <span className={rateLimitInfo.remaining === 0 ? 'text-red-400' : 'text-slate-300'}>{rateLimitInfo.remaining} / {rateLimitInfo.limit}</span> Remaining</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Output Panel */}
                <div className="lg:col-span-5">
                    <AnimatePresence mode="wait">
                        {!status && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl p-12 text-center"
                            >
                                <div className="p-6 bg-white/5 rounded-full mb-6">
                                    <Film className="w-12 h-12 text-slate-600" />
                                </div>
                                <h3 className="text-white font-bold mb-2">Cinematic Preview</h3>
                                <p className="text-slate-500 text-sm max-w-[200px]">Configure your parameters to begin rendering</p>
                            </motion.div>
                        )}

                        {status && status.state !== 'completed' && status.state !== 'failed' && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full bg-slate-900/80 backdrop-blur-3xl border border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent)] animate-pulse" />
                                <div className="relative z-10">
                                    <div className="w-24 h-24 relative mb-8 mx-auto">
                                        <div className="absolute inset-0 rounded-full border-4 border-white/5 border-t-purple-500 animate-[spin_3s_linear_infinite]" />
                                        <div className="absolute inset-2 rounded-full border-4 border-white/5 border-t-pink-500 animate-[spin_2s_linear_infinite_reverse]" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sparkles className="w-8 h-8 text-white animate-pulse" />
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-white mb-2">{status.state === 'pending' ? 'Initializing...' : 'Rendering Assets'}</h3>
                                    <p className="text-slate-400 text-sm mb-8 font-mono">{activeProvider && `Routing via ${activeProvider}`}</p>

                                    <div className="w-full max-w-xs mx-auto bg-black/40 rounded-full h-1.5 overflow-hidden border border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${status.progress || 10}%` }}
                                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-widest">Est. time 60-90s · High Fidelity Render</p>
                                </div>
                            </motion.div>
                        )}

                        {status?.state === 'completed' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col h-full"
                            >
                                <div className="relative aspect-video bg-slate-900">
                                    <video
                                        src={status.videoUrl}
                                        controls
                                        className="w-full h-full object-contain"
                                        autoPlay
                                        loop
                                    />
                                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-green-500/20 backdrop-blur-md border border-green-500/30 text-green-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                        <CheckCircle2 className="w-3 h-3" /> Rendered
                                    </div>
                                </div>

                                <div className="p-8 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="flex-1">
                                            <h4 className="text-white font-bold text-lg line-clamp-1">{prompt.slice(0, 40)}...</h4>
                                            <p className="text-xs text-slate-500 italic">4K Upscale Available</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <a
                                            href={status.videoUrl}
                                            download
                                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-bold text-sm transition-all"
                                        >
                                            <Download className="w-4 h-4" /> Export
                                        </a>
                                        <button
                                            onClick={handleSaveToUploads}
                                            disabled={saving || saved}
                                            className={`flex-[2] flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all ${saved
                                                ? 'bg-green-600/20 border border-green-500/30 text-green-400'
                                                : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20'
                                                } disabled:opacity-50`}
                                        >
                                            {saving ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : saved ? (
                                                <>
                                                    <CheckCircle2 className="w-5 h-5" /> Saved to Studio
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-5 h-5 fill-current" /> Initialize Upload
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mt-6 flex gap-3 items-start"
                            >
                                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                                <p className="text-xs text-red-200/70 leading-relaxed">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
