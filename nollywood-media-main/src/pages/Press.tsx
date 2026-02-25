import { Link } from 'react-router-dom';
import { ArrowLeft, Newspaper, Calendar } from 'lucide-react';

export default function Press() {
    const pressReleases = [
        {
            date: 'February 2026',
            title: 'NaijaMation Launches Premium Streaming for Nollywood Content',
            excerpt: 'The platform opens its doors to millions of African cinema fans worldwide with a curated library of Nollywood films, series, and original content.',
        },
        {
            date: 'January 2026',
            title: 'Creator Studio Empowers Independent Filmmakers',
            excerpt: 'NaijaMation introduces its Creator Studio, giving independent Nollywood filmmakers tools to publish, monetize, and grow their audience.',
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
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Press & Media</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        News, announcements, and media resources from NaijaMation.
                    </p>
                </div>

                <section className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Brand Assets</h2>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Download our official logos, brand guidelines, and media kit for press coverage.
                        </p>
                        <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                            Download Media Kit
                        </button>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Press Releases</h2>
                    <div className="space-y-6">
                        {pressReleases.map((release, index) => (
                            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:border-red-600/50 transition-colors">
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    <Calendar className="w-4 h-4" />
                                    <span>{release.date}</span>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{release.title}</h3>
                                <p className="text-gray-600 dark:text-gray-400">{release.excerpt}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                    <Newspaper className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Media Inquiries</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        For press inquiries, interviews, or media coverage requests:
                    </p>
                    <a href="mailto:press@naijamation.com" className="text-red-600 hover:underline font-medium">
                        press@naijamation.com
                    </a>
                </section>
            </div>
        </div>
    );
}
