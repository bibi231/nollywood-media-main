import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Users, TrendingUp, AlertTriangle, ChevronRight, Film, Clapperboard } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Forums() {
    const categories = [
        { name: 'General Discussion', description: 'Talk about anything related to Nollywood, African cinema, and the future of storytelling.', topics: 1240, icon: MessageCircle, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { name: 'Film Reviews', description: 'Share your thoughts, deep dives, and critiques on films you\'ve watched on NaijaMation.', topics: 856, icon: Film, color: 'text-red-500', bg: 'bg-red-500/10' },
        { name: 'Creators & Filmmaking', description: 'Tips, advice, and collaboration boards for aspiring and established independent filmmakers.', topics: 432, icon: Clapperboard, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { name: 'Platform Feedback', description: 'Share your suggestions, feature requests, and bug reports to help improve NaijaMation.', topics: 156, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { duration: 0.5, ease: "easeOut" as const }
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-red-500/30">
            {/* Hero Header */}
            <div className="relative pt-32 pb-16 px-4 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-red-600/10 blur-[130px] rounded-full pointer-events-none" />

                <div className="max-w-5xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-red-500 mb-10 transition-colors group">
                            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium tracking-wide">Back Home</span>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                    >
                        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                            Community <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">Forums</span>
                        </h1>
                        <p className="text-xl text-slate-400 max-w-2xl font-light leading-relaxed">
                            Connect with fellow Nollywood fans, African animation enthusiasts, and independent creators from around the globe.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 pb-32 relative z-10">

                {/* Under Construction Banner */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="relative overflow-hidden bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 md:p-8 mb-16 shadow-[0_0_30px_rgba(245,158,11,0.05)]"
                >
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/20 blur-3xl rounded-full" />
                    <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="p-4 bg-amber-500/20 rounded-xl shrink-0">
                            <AlertTriangle className="w-8 h-8 text-amber-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-amber-500 mb-2">🚧 Under Construction</h2>
                            <p className="text-amber-200/70 text-lg">
                                Our community boards are currently being migrated to a new, faster infrastructure. You can view the board categories below, but posting is disabled during this maintenance window.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Categories Grid */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                    {categories.map((category) => (
                        <motion.div
                            key={category.name}
                            variants={itemVariants}
                            className="group relative border border-slate-800 bg-slate-900/40 rounded-3xl p-8 hover:bg-slate-900 hover:border-slate-700 transition-all duration-300 cursor-not-allowed overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`p-4 rounded-2xl ${category.bg} border border-slate-800`}>
                                        <category.icon className={`w-8 h-8 ${category.color}`} />
                                    </div>
                                    <div className="px-4 py-1.5 bg-slate-800/50 rounded-full border border-slate-800 text-sm font-medium text-slate-400">
                                        {category.topics.toLocaleString()} Topics
                                    </div>
                                </div>

                                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors">
                                    {category.name}
                                </h3>
                                <p className="text-slate-400 leading-relaxed mb-8 h-14">
                                    {category.description}
                                </p>

                                <div className="flex items-center gap-2 text-slate-500 font-medium text-sm">
                                    <span className="flex-1 h-px bg-slate-800" />
                                    <span>Locked</span>
                                    <span className="flex-1 h-px bg-slate-800" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Engage Section */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mt-20 relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 p-12 text-center flex flex-col items-center justify-center"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-red-600/5 to-transparent pointer-events-none" />

                    <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.15)] mb-6">
                        <Users className="w-8 h-8 text-red-500" />
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Join the Discord</h2>
                    <p className="text-slate-400 max-w-lg text-lg leading-relaxed mb-8">
                        While the forums are down, the conversation continues live on our Discord server. Connect instantly with thousands of other NaijaMation members.
                    </p>

                    <button className="flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-1">
                        Connect to Discord Server
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
