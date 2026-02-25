import { BackButton } from '../components/BackButton';
import { Newspaper, Users, Handshake, Award, Megaphone } from 'lucide-react';
import { Link } from 'react-router-dom';

const COMMUNITY_LINKS = [
    { to: '/blog', icon: Newspaper, title: 'Blog', desc: 'Latest news, updates, and stories from the NaijaMation team' },
    { to: '/advertise', icon: Megaphone, title: 'Advertise', desc: 'Reach millions of African cinema enthusiasts' },
    { to: '/press', icon: Award, title: 'Press', desc: 'Press kit, media inquiries, and brand assets' },
    { to: '/contributors', icon: Users, title: 'Contributors', desc: 'Join our community of creators and developers' },
    { to: '/partners', icon: Handshake, title: 'Partners', desc: 'Strategic partnerships and collaborations' },
];

export default function Community() {
    return (
        <div className="bg-white dark:bg-gray-900 min-h-screen pt-14 lg:pl-60">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-3">
                    <BackButton fallback="/" label="Back" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Community</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Connect with the NaijaMation ecosystem
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {COMMUNITY_LINKS.map(({ to, icon: Icon, title, desc }) => (
                        <Link
                            key={to}
                            to={to}
                            className="flex items-start gap-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600 hover:shadow-lg transition-all group"
                        >
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-600 transition-colors">
                                <Icon className="h-6 w-6 text-red-600 group-hover:text-white transition-colors" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
