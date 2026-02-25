import { Link } from 'react-router-dom';
import { ArrowLeft, Cookie, Shield, Settings } from 'lucide-react';

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-20">
                <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Home</span>
                </Link>

                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Cookie Policy</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: February 2026</p>

                <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Cookie className="w-6 h-6 text-red-600" />
                            What Are Cookies?
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            Cookies are small text files stored on your device when you visit our platform. They help us provide you with a better experience by remembering your preferences, keeping you signed in, and understanding how you use NaijaMation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Shield className="w-6 h-6 text-red-600" />
                            How We Use Cookies
                        </h2>
                        <div className="space-y-4">
                            {[
                                { type: 'Essential Cookies', description: 'Required for authentication, session management, and core platform functionality. These cannot be disabled.' },
                                { type: 'Analytics Cookies', description: 'Help us understand how you use the platform, which content is popular, and how we can improve your experience.' },
                                { type: 'Preference Cookies', description: 'Remember your settings like language, region, playback preferences, and display mode.' },
                                { type: 'Advertising Cookies', description: 'Used to deliver relevant ads and measure ad campaign effectiveness. Only active for free-tier users.' },
                            ].map((cookie) => (
                                <div key={cookie.type} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{cookie.type}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{cookie.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Settings className="w-6 h-6 text-red-600" />
                            Managing Your Cookies
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            You can manage your cookie preferences through your browser settings. Please note that disabling certain cookies may affect platform functionality. For more details about your privacy rights, please see our{' '}
                            <Link to="/privacy" className="text-red-600 hover:underline">Privacy Policy</Link>.
                        </p>
                    </section>

                    <section className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Questions?</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            If you have any questions about our use of cookies, please contact us at{' '}
                            <a href="mailto:privacy@naijamation.com" className="text-red-600 hover:underline">privacy@naijamation.com</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
