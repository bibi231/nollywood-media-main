import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Users, TrendingUp } from 'lucide-react';

export default function Forums() {
    const categories = [
        { name: 'General Discussion', description: 'Talk about anything related to Nollywood and African cinema', topics: 0, icon: MessageCircle },
        { name: 'Film Reviews', description: 'Share your thoughts on films you\'ve watched', topics: 0, icon: TrendingUp },
        { name: 'Filmmaking Tips', description: 'Tips and advice for aspiring filmmakers', topics: 0, icon: Users },
        { name: 'Platform Feedback', description: 'Share your suggestions for improving NaijaMation', topics: 0, icon: MessageCircle },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-20">
                <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Home</span>
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Community Forums</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Connect with fellow Nollywood fans and creators.
                    </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6 mb-8">
                    <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-300 mb-2">🚧 Coming Soon</h2>
                    <p className="text-amber-700 dark:text-amber-400">
                        Our community forums are currently under development. In the meantime, join our social media channels to connect with other fans.
                    </p>
                </div>

                <div className="space-y-4">
                    {categories.map((category) => (
                        <div key={category.name} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 opacity-60">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                    <category.icon className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                                </div>
                                <span className="text-sm text-gray-400">{category.topics} topics</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
