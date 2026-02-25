import { Link } from 'react-router-dom';
import { ArrowLeft, Handshake, Globe, Users, TrendingUp } from 'lucide-react';

export default function Partners() {
    const benefits = [
        { icon: Globe, title: 'Global Reach', description: 'Access millions of viewers across Africa and the diaspora.' },
        { icon: Users, title: 'Engaged Audience', description: 'Our users are passionate about African stories and culture.' },
        { icon: TrendingUp, title: 'Growing Platform', description: 'Join a rapidly expanding ecosystem of creators and viewers.' },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-20">
                <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Home</span>
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Partner With Us</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Let's build the future of African entertainment together.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-3 mb-12">
                    {benefits.map((benefit) => (
                        <div key={benefit.title} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
                            <benefit.icon className="w-10 h-10 text-red-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{benefit.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{benefit.description}</p>
                        </div>
                    ))}
                </div>

                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Partnership Opportunities</h2>
                    <div className="space-y-4">
                        {[
                            { title: 'Content Distribution', description: 'Distribute your film catalog through our platform to reach new audiences.' },
                            { title: 'Studio Partnership', description: 'Partner with us for exclusive premieres and co-productions.' },
                            { title: 'Technology Integration', description: 'Integrate your tools and services with our streaming infrastructure.' },
                            { title: 'Brand Sponsorship', description: 'Sponsor content categories, events, or platform features.' },
                        ].map((opp) => (
                            <div key={opp.title} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-600/50 transition-colors">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{opp.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400">{opp.description}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-center text-white">
                    <Handshake className="w-12 h-12 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Interested in Partnering?</h2>
                    <p className="text-red-100 mb-4">Get in touch with our partnerships team to explore opportunities.</p>
                    <a href="mailto:partnerships@naijamation.com" className="inline-block px-6 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        Contact Partnerships Team
                    </a>
                </div>
            </div>
        </div>
    );
}
