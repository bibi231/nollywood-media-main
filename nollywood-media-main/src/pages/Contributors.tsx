import { Link } from 'react-router-dom';
import { ArrowLeft, Award, Upload, Star, Eye } from 'lucide-react';

export default function Contributors() {
    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-20">
                <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-red-600 mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Back to Home</span>
                </Link>

                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Top Contributors</h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        The talented creators and filmmakers powering NaijaMation's content library.
                    </p>
                </div>

                <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-8 text-white mb-12">
                    <h2 className="text-2xl font-bold mb-2">Become a Contributor</h2>
                    <p className="text-red-100 mb-4">
                        Share your films, short stories, and creative content with millions of viewers worldwide.
                    </p>
                    <Link to="/account/upload" className="inline-flex items-center gap-2 px-6 py-2 bg-white text-red-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        <Upload className="w-4 h-4" />
                        Start Uploading
                    </Link>
                </div>

                <div className="grid gap-6 md:grid-cols-3 mb-12">
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
                        <Upload className="w-8 h-8 text-red-600 mx-auto mb-3" />
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">—</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Uploads</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
                        <Eye className="w-8 h-8 text-red-600 mx-auto mb-3" />
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">—</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center">
                        <Star className="w-8 h-8 text-red-600 mx-auto mb-3" />
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">—</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Avg. Rating</p>
                    </div>
                </div>

                <div className="text-center py-12">
                    <Award className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Leaderboard Coming Soon</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        Be among the first to upload content and claim your spot on the contributor leaderboard.
                    </p>
                </div>
            </div>
        </div>
    );
}
