import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Blog() {
    const posts = [
        {
            slug: 'welcome-to-naijamation',
            title: 'Welcome to NaijaMation — The Future of Nollywood Streaming',
            excerpt: 'We\'re building the premier destination for authentic Nigerian cinema and African storytelling. Here\'s our vision.',
            date: 'February 20, 2026',
            readTime: '5 min read',
            category: 'Announcements',
            image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
        },
        {
            slug: 'creator-spotlight-series',
            title: 'Creator Spotlight: Meet the Filmmakers Behind NaijaMation',
            excerpt: 'Discover the talented independent filmmakers who are bringing their stories to our platform in stunning 4K.',
            date: 'February 15, 2026',
            readTime: '8 min read',
            category: 'Community',
            image: 'https://images.unsplash.com/photo-1601362840469-51e4d8d58785?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
        },
        {
            slug: 'nollywood-is-global',
            title: 'How Nollywood Became the World\'s Second-Largest Film Industry',
            excerpt: 'The remarkable rise of Nigerian cinema and why it matters for the global entertainment landscape and streaming trends.',
            date: 'February 10, 2026',
            readTime: '6 min read',
            category: 'Industry',
            image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80',
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-red-500/30">
            {/* Header / Hero Section */}
            <div className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[300px] bg-red-600/20 blur-[120px] rounded-full pointer-events-none" />

                <div className="max-w-6xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-red-500 mb-12 transition-colors group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium tracking-wide">Back Home</span>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                            The <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">NaijaMation</span> Blog
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl font-light leading-relaxed">
                            Dive deep into the stories behind the screen. News, insights, and creator spotlights from the heart of African cinema.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Matrix / Post Grid */}
            <div className="max-w-6xl mx-auto px-4 pb-32 relative z-10">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    {posts.map((post, i) => (
                        <motion.article
                            key={post.slug}
                            variants={itemVariants}
                            className={`group relative flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-red-500/50 transition-colors duration-500 ${i === 0 ? 'md:col-span-2 lg:col-span-3 lg:flex-row shadow-[0_0_50px_-20px_rgba(220,38,38,0.3)]' : ''}`}
                        >
                            <div className={`relative overflow-hidden ${i === 0 ? 'lg:w-[60%]' : 'w-full aspect-[4/3]'} shrink-0`}>
                                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
                                />
                                <div className="absolute top-4 left-4 z-20">
                                    <span className="px-4 py-1.5 bg-red-600 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-lg shadow-red-900/50">
                                        {post.category}
                                    </span>
                                </div>
                            </div>

                            <div className={`flex flex-col justify-center flex-1 p-8 ${i === 0 ? 'lg:p-12' : ''}`}>
                                <div className="flex items-center gap-4 text-sm font-medium text-slate-400 mb-4">
                                    <span>{post.date}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                                    <span className="flex items-center gap-1.5 text-red-400">
                                        <Clock className="w-4 h-4" />
                                        {post.readTime}
                                    </span>
                                </div>

                                <h2 className={`font-bold text-white mb-4 group-hover:text-red-400 transition-colors ${i === 0 ? 'text-3xl md:text-4xl' : 'text-2xl'} tracking-tight leading-snug`}>
                                    {post.title}
                                </h2>

                                <p className={`text-slate-400 leading-relaxed ${i === 0 ? 'text-lg mb-8' : 'mb-6'} flex-1`}>
                                    {post.excerpt}
                                </p>

                                <button className="inline-flex items-center gap-2 text-red-500 font-bold tracking-wide uppercase text-sm mt-auto group/btn">
                                    Read Article
                                    <ChevronRight className="w-4 h-4 transform group-hover/btn:translate-x-1 group-hover/btn:text-white transition-all" />
                                </button>
                            </div>
                        </motion.article>
                    ))}
                </motion.div>

                {/* Coming Soon Graphic block */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mt-24 relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/50 p-12 text-center"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542204165-65bf26472b9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80')] opacity-5 blur-sm mix-blend-screen bg-cover bg-center point-events-none" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-900 border border-slate-700 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.15)] mb-6">
                            <BookOpen className="w-8 h-8 text-red-500" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">The Story Continues</h2>
                        <p className="text-slate-400 max-w-xl mx-auto text-lg leading-relaxed">
                            We're just getting started. Subscribe to our newsletter to get the latest essays, industry deep-dives, and platform updates sent straight to your inbox.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
