import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { Settings as SettingsIcon, Bell, Shield, Palette, Globe, Save, Loader2, CheckCircle } from 'lucide-react';

export function Settings() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);

    const [settings, setSettings] = useState({
        // Notifications
        email_notifications: true,
        push_notifications: true,
        new_content_alerts: true,
        comment_replies: true,
        weekly_digest: false,

        // Privacy
        profile_visibility: 'public',
        show_watch_history: true,
        show_watchlist: false,

        // Preferences
        language: 'en',
        theme: 'system',
        autoplay: true,
        default_quality: 'auto',
        subtitle_language: 'en',

        // Content
        content_maturity: 'all',
        region_preference: 'all',
    });

    useEffect(() => {
        loadSettings();
    }, [user]);

    const loadSettings = async () => {
        if (!user) return;
        try {
            const { data } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data) {
                setSettings(prev => ({ ...prev, ...data.preferences }));
            }
        } catch (err) {
            console.error('Error loading settings:', err);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setLoading(true);
        setSaved(false);

        try {
            await supabase
                .from('user_settings')
                .upsert({
                    user_id: user.id,
                    preferences: settings,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateSetting = (key: string, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <SettingsIcon className="h-6 w-6" />
                    Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">Manage your account preferences</p>
            </div>

            <div className="space-y-6">
                {/* Notifications */}
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Bell className="h-5 w-5 text-red-600" />
                        Notifications
                    </h2>
                    <div className="space-y-4">
                        {[
                            { key: 'email_notifications', label: 'Email notifications', desc: 'Receive updates via email' },
                            { key: 'push_notifications', label: 'Push notifications', desc: 'Browser push notifications' },
                            { key: 'new_content_alerts', label: 'New content alerts', desc: 'When creators you follow upload' },
                            { key: 'comment_replies', label: 'Comment replies', desc: 'When someone replies to your comments' },
                            { key: 'weekly_digest', label: 'Weekly digest', desc: 'Top picks email every week' },
                        ].map(({ key, label, desc }) => (
                            <div key={key} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                                </div>
                                <button
                                    onClick={() => updateSetting(key, !settings[key as keyof typeof settings])}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[key as keyof typeof settings] ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Privacy */}
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-red-600" />
                        Privacy
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Profile visibility</label>
                            <select
                                value={settings.profile_visibility}
                                onChange={(e) => updateSetting('profile_visibility', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                            >
                                <option value="public">Public</option>
                                <option value="followers">Followers only</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                        {[
                            { key: 'show_watch_history', label: 'Show watch history', desc: 'Others can see what you watched' },
                            { key: 'show_watchlist', label: 'Show watchlist', desc: 'Others can see your watchlist' },
                        ].map(({ key, label, desc }) => (
                            <div key={key} className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                                </div>
                                <button
                                    onClick={() => updateSetting(key, !settings[key as keyof typeof settings])}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[key as keyof typeof settings] ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Playback */}
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Palette className="h-5 w-5 text-red-600" />
                        Playback & Display
                    </h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Theme</label>
                                <select
                                    value={settings.theme}
                                    onChange={(e) => updateSetting('theme', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                                >
                                    <option value="system">System default</option>
                                    <option value="light">Light</option>
                                    <option value="dark">Dark</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Video quality</label>
                                <select
                                    value={settings.default_quality}
                                    onChange={(e) => updateSetting('default_quality', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                                >
                                    <option value="auto">Auto</option>
                                    <option value="1080p">1080p</option>
                                    <option value="720p">720p</option>
                                    <option value="480p">480p</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Autoplay</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Automatically play the next video</p>
                            </div>
                            <button
                                onClick={() => updateSetting('autoplay', !settings.autoplay)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.autoplay ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.autoplay ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Content Preferences */}
                <section className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Globe className="h-5 w-5 text-red-600" />
                        Content Preferences
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Language</label>
                            <select
                                value={settings.language}
                                onChange={(e) => updateSetting('language', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                            >
                                <option value="en">English</option>
                                <option value="yo">Yoruba</option>
                                <option value="ig">Igbo</option>
                                <option value="ha">Hausa</option>
                                <option value="pcm">Pidgin English</option>
                                <option value="fr">French</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Content maturity</label>
                            <select
                                value={settings.content_maturity}
                                onChange={(e) => updateSetting('content_maturity', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                            >
                                <option value="all">All ages</option>
                                <option value="pg13">PG-13 and below</option>
                                <option value="mature">Include mature content</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Subtitle language</label>
                            <select
                                value={settings.subtitle_language}
                                onChange={(e) => updateSetting('subtitle_language', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                            >
                                <option value="en">English</option>
                                <option value="yo">Yoruba</option>
                                <option value="ig">Igbo</option>
                                <option value="ha">Hausa</option>
                                <option value="fr">French</option>
                                <option value="off">Off</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">Region preference</label>
                            <select
                                value={settings.region_preference}
                                onChange={(e) => updateSetting('region_preference', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                            >
                                <option value="all">All regions</option>
                                <option value="nigeria">Nigeria</option>
                                <option value="ghana">Ghana</option>
                                <option value="kenya">Kenya</option>
                                <option value="south-africa">South Africa</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Save */}
                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : saved ? (
                            <CheckCircle className="h-5 w-5" />
                        ) : (
                            <Save className="h-5 w-5" />
                        )}
                        {saved ? 'Saved!' : 'Save Settings'}
                    </button>
                </div>
            </div>
        </div>
    );
}
