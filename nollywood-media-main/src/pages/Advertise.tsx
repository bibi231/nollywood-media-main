import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart3, Eye, Target, Megaphone } from 'lucide-react';

export default function Advertise() {
    const adFormats = [
        { icon: Eye, name: 'Display Banners', description: 'High-visibility banner ads across homepage, catalog, and search pages.', pricing: 'CPM from $2.00' },
        { icon: Megaphone, name: 'Video Pre-Roll', description: '15-30 second ads before content, with skip-after-5s option.', pricing: 'CPV from $0.05' },
        { icon: Target, name: 'Sponsored Content', description: 'Featured placement in content rows and recommendation feeds.', pricing: 'Custom pricing' },
        { icon: BarChart3, name: 'Native In-Feed', description: 'Seamless ad cards within browse and search results.', pricing: 'CPC from $0.50' },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-20">
                <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Home</span>
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Advertise on NaijaMation</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Reach a passionate, engaged audience of African cinema and entertainment fans.
                    </p>
                </div>

                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Ad Formats</h2>
                    <div className="grid gap-6 md:grid-cols-2">
                        {adFormats.map((format) => (
                            <div key={format.name} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-600/50 transition-colors">
                                <format.icon className="w-8 h-8 text-red-600 mb-3" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{format.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{format.description}</p>
                                <span className="text-sm font-medium text-red-600">{format.pricing}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Why Advertise With Us?</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        {[
                            { stat: '100K+', label: 'Monthly Active Users' },
                            { stat: '85%', label: 'Mobile Engagement' },
                            { stat: '12min', label: 'Avg. Session Duration' },
                        ].map((item) => (
                            <div key={item.label} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
                                <h3 className="text-3xl font-bold text-red-600 mb-1">{item.stat}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-center text-white">
                    <Megaphone className="w-12 h-12 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
                    <p className="text-red-100 mb-4">Contact our advertising team for custom packages and campaign planning.</p>
                    <a href="mailto:ads@naijamation.com" className="inline-block px-6 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        Contact Ad Sales
                    </a>
                </div>
            </div>
        </div>
    );
}
