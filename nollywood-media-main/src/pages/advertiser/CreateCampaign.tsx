import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Target, Image as ImageIcon, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

type Step = 'goals' | 'targeting' | 'creative' | 'review';

export function CreateCampaign() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('goals');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        budget_total: 100,
        pricing_model: 'CPM' as 'CPM' | 'CPC',
        price_per_unit: 2.00,
        adType: 'banner' as 'banner' | 'video_preroll' | 'native_feed',
        geo_countries: [] as string[],
        categories: [] as string[],
        content_url: '',
        destination_url: '',
        alt_text: '',
    });

    const steps: { key: Step; label: string; icon: any }[] = [
        { key: 'goals', label: 'Campaign Goals', icon: Megaphone },
        { key: 'targeting', label: 'Targeting', icon: Target },
        { key: 'creative', label: 'Creative', icon: ImageIcon },
        { key: 'review', label: 'Review', icon: CheckCircle2 },
    ];

    const handleNext = () => {
        if (step === 'goals') setStep('targeting');
        else if (step === 'targeting') setStep('creative');
        else if (step === 'creative') setStep('review');
    };

    const handleBack = () => {
        if (step === 'targeting') setStep('goals');
        else if (step === 'creative') setStep('targeting');
        else if (step === 'review') setStep('creative');
    };

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Create campaign
            const { data: campaign, error: cError } = await supabase
                .from('ad_campaigns')
                .insert({
                    advertiser_id: user.id,
                    name: formData.name,
                    budget_total: formData.budget_total,
                    budget_remaining: formData.budget_total,
                    pricing_model: formData.pricing_model,
                    price_per_unit: formData.price_per_unit,
                    status: 'pending_approval'
                })
                .select()
                .single();

            if (cError) throw cError;

            // 2. Create targeting
            const { error: tError } = await supabase
                .from('ad_targeting')
                .insert({
                    campaign_id: campaign.id,
                    geo_countries: formData.geo_countries,
                    categories: formData.categories
                });

            if (tError) throw tError;

            // 3. Create ad unit
            const { error: uError } = await supabase
                .from('ad_units')
                .insert({
                    campaign_id: campaign.id,
                    type: formData.adType,
                    content_url: formData.content_url,
                    destination_url: formData.destination_url,
                    alt_text: formData.alt_text
                });

            if (uError) throw uError;

            navigate('/advertiser');
        } catch (err: any) {
            console.error('Error creating campaign:', err);
            setError(err.message || 'Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-12">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Create New Campaign</h1>
                <p className="text-gray-600 dark:text-gray-400">Reach your ideal audience with precision</p>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-12 relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -translate-y-1/2 z-0"></div>
                {steps.map((s, idx) => {
                    const isCompleted = steps.findIndex(x => x.key === step) > idx;
                    const isActive = s.key === step;
                    return (
                        <div key={s.key} className="relative z-10 flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCompleted || isActive ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-400'
                                }`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <span className={`absolute -bottom-7 text-xs font-semibold whitespace-nowrap transition-colors ${isActive ? 'text-red-600' : 'text-gray-500'
                                }`}>{s.label}</span>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 pt-12">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {step === 'goals' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Campaign Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 outline-none"
                                placeholder="e.g. Summer Blockbuster Launch"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Total Budget ($)</label>
                                <input
                                    type="number"
                                    value={formData.budget_total}
                                    onChange={e => setFormData({ ...formData, budget_total: parseFloat(e.target.value) })}
                                    className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Pricing Model</label>
                                <select
                                    value={formData.pricing_model}
                                    onChange={e => setFormData({ ...formData, pricing_model: e.target.value as 'CPM' | 'CPC' })}
                                    className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 outline-none"
                                >
                                    <option value="CPM">CPM (Cost per 1k views)</option>
                                    <option value="CPC">CPC (Cost per click)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Bid Amount ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.price_per_unit}
                                onChange={e => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) })}
                                className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-2 italic">Recommended bid: $2.50 - $4.00</p>
                        </div>
                    </div>
                )}

                {step === 'targeting' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Geo Targeting (Countries)</label>
                            <div className="flex flex-wrap gap-2">
                                {['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'UK', 'USA'].map(c => (
                                    <button
                                        key={c}
                                        onClick={() => {
                                            const newGeo = formData.geo_countries.includes(c)
                                                ? formData.geo_countries.filter(x => x !== c)
                                                : [...formData.geo_countries, c];
                                            setFormData({ ...formData, geo_countries: newGeo });
                                        }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${formData.geo_countries.includes(c)
                                                ? 'bg-red-600 text-white border-red-600'
                                                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Categories</label>
                            <div className="flex flex-wrap gap-2">
                                {['Action', 'Comedy', 'Drama', 'Nollywood Classics', 'Music'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => {
                                            const newCat = formData.categories.includes(cat)
                                                ? formData.categories.filter(x => x !== cat)
                                                : [...formData.categories, cat];
                                            setFormData({ ...formData, categories: newCat });
                                        }}
                                        className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${formData.categories.includes(cat)
                                                ? 'bg-red-600 text-white border-red-600'
                                                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {step === 'creative' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Ad Format</label>
                            <div className="grid grid-cols-3 gap-4">
                                {(['banner', 'video_preroll', 'native_feed'] as const).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setFormData({ ...formData, adType: type })}
                                        className={`px-4 py-4 rounded-xl text-sm font-bold border capitalize transition-all ${formData.adType === type
                                                ? 'bg-red-50 text-red-600 border-red-600 dark:bg-red-900/20'
                                                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        {type.replace('_', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Image/Video URL</label>
                            <input
                                type="text"
                                value={formData.content_url}
                                onChange={e => setFormData({ ...formData, content_url: e.target.value })}
                                className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 outline-none"
                                placeholder="https://example.com/asset.jpg"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Destination URL</label>
                            <input
                                type="text"
                                value={formData.destination_url}
                                onChange={e => setFormData({ ...formData, destination_url: e.target.value })}
                                className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 outline-none"
                                placeholder="https://mywebsite.com/landing-page"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Alt Text</label>
                            <input
                                type="text"
                                value={formData.alt_text}
                                onChange={e => setFormData({ ...formData, alt_text: e.target.value })}
                                className="w-full px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-red-600 outline-none"
                                placeholder="Brief description of the ad creative"
                            />
                        </div>
                    </div>
                )}

                {step === 'review' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">General Info</h4>
                                <p className="text-gray-900 dark:text-white font-bold text-xl">{formData.name}</p>
                                <div className="flex gap-4">
                                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-bold">{formData.adType.toUpperCase()}</span>
                                    <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold">{formData.pricing_model}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Budget & Bid</h4>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-gray-900 dark:text-white font-bold text-2xl">${formData.budget_total}</span>
                                    <span className="text-gray-400 text-sm">Total</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-gray-600 dark:text-gray-300 font-bold">${formData.price_per_unit}</span>
                                    <span className="text-gray-400 text-sm">per {formData.pricing_model === 'CPM' ? '1k units' : 'click'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Targeting Summary</h4>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {formData.geo_countries.length > 0 ? formData.geo_countries.map(c => (
                                    <span key={c} className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium">{c}</span>
                                )) : <span className="text-gray-500 text-sm italic">Worldwide</span>}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.categories.length > 0 ? formData.categories.map(cat => (
                                    <span key={cat} className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium">{cat}</span>
                                )) : <span className="text-gray-500 text-sm italic">All Categories</span>}
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-12 flex justify-between">
                    {step !== 'goals' ? (
                        <button
                            onClick={handleBack}
                            className="flex items-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {step === 'review' ? (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Launch Campaign'}
                            {!loading && <Megaphone className="w-5 h-5" />}
                        </button>
                    ) : (
                        <button
                            onClick={handleNext}
                            className="flex items-center gap-2 px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-bold transition-all shadow-xl"
                        >
                            Continue
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
