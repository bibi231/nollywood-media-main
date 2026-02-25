import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock } from 'lucide-react';

export default function Blog() {
    const posts = [
        {
            slug: 'welcome-to-naijamation',
            title: 'Welcome to NaijaMation — The Future of Nollywood Streaming',
            excerpt: 'We\'re building the premier destination for authentic Nigerian cinema and African storytelling. Here\'s our vision.',
            date: 'February 20, 2026',
            readTime: '5 min read',
            category: 'Announcements',
        },
        {
            slug: 'creator-spotlight-series',
            title: 'Creator Spotlight: Meet the Filmmakers Behind NaijaMation',
            excerpt: 'Discover the talented independent filmmakers who are bringing their stories to our platform.',
            date: 'February 15, 2026',
            readTime: '8 min read',
            category: 'Community',
        },
        {
            slug: 'nollywood-is-global',
            title: 'How Nollywood Became the World\'s Second-Largest Film Industry',
            excerpt: 'The remarkable rise of Nigerian cinema and why it matters for the global entertainment landscape.',
            date: 'February 10, 2026',
            readTime: '6 min read',
            category: 'Industry',
        },
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-20">
                <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Home</span>
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Blog</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Stories, updates, and insights from the NaijaMation team.
                    </p>
                </div>

                <div className="space-y-8">
                    {posts.map((post) => (
                        <article key={post.slug} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-600/50 hover:shadow-lg transition-all group">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-semibold rounded-full">
                                    {post.category}
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">{post.date}</span>
                                <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    {post.readTime}
                                </span>
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 transition-colors">
                                {post.title}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">{post.excerpt}</p>
                        </article>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
                        <BookOpen className="w-12 h-12 text-red-600 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">More Posts Coming Soon</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            We're just getting started. Stay tuned for more stories from the NaijaMation universe.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
