import { Link } from 'react-router-dom';
import { ArrowLeft, Newspaper, Calendar, Download, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Press() {
    const pressReleases = [
        {
            date: 'February 20, 2026',
            title: 'NaijaMation Launches Premium Streaming for Nollywood Content',
            excerpt: 'The platform opens its doors to millions of African cinema fans worldwide with a curated library of Nollywood films, series, and original content in stunning 4K resolution. The launch marks a new era for decentralized African entertainment distribution.',
        },
        {
            date: 'January 15, 2026',
            title: 'Creator Studio Empowers Independent Filmmakers',
            excerpt: 'NaijaMation introduces its comprehensive Creator Studio, equipping independent Nollywood filmmakers with unprecedented tools to publish content, monetize directly with viewers, and grow their global audience through data-driven insights.',
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15 }
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
            {/* Hero Section */}
            <div className="relative pt-32 pb-20 px-4 overflow-hidden">
                <div className="absolute top-0 right-1/4 w-[600px] h-[300px] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute top-40 left-1/4 w-[400px] h-[400px] bg-slate-700/20 blur-[100px] rounded-full pointer-events-none" />

                <div className="max-w-4xl mx-auto relative z-10">
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
                            Press & <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-600">Media</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl font-light leading-relaxed">
                            Official news, company announcements, and high-resolution brand assets for NaijaMation press coverage.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 pb-32 relative z-10">

                {/* Brand Assets Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mb-16"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <h2 className="text-3xl font-bold text-white">Brand Assets</h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                    </div>

                    <div className="relative group bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="flex-1">
                                <h3 className="text-2xl font-semibold text-white mb-3">Media Kit</h3>
                                <p className="text-slate-400 text-lg leading-relaxed max-w-xl">
                                    Download our official, high-resolution logos, brand guidelines, platform screenshots, and executive headshots.
                                </p>
                            </div>

                            <button className="shrink-0 flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-slate-200 text-slate-950 font-bold rounded-xl transition-colors shadow-[0_0_30px_rgba(255,255,255,0.1)] group/btn">
                                <Download className="w-5 h-5 transform group-hover/btn:-translate-y-1 group-hover/btn:text-red-600 transition-all" />
                                Download Kit (.zip)
                            </button>
                        </div>
                    </div>
                </motion.section>

                {/* Press Releases Section */}
                <section className="mb-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex items-center gap-4 mb-8"
                    >
                        <h2 className="text-3xl font-bold text-white">Press Releases</h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                    </motion.div>

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-6"
                    >
                        {pressReleases.map((release, index) => (
                            <motion.article
                                key={index}
                                variants={itemVariants}
                                className="group relative bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:bg-slate-900 hover:border-red-500/30 transition-all duration-300"
                            >
                                <div className="flex items-center gap-3 text-sm font-medium text-slate-500 mb-4 tracking-wide">
                                    <Calendar className="w-4 h-4 text-red-500/70" />
                                    <span>{release.date}</span>
                                </div>

                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 tracking-tight group-hover:text-red-400 transition-colors">
                                    {release.title}
                                </h3>

                                <p className="text-slate-400 text-lg leading-relaxed mb-6">
                                    {release.excerpt}
                                </p>

                                <button className="inline-flex items-center gap-2 text-red-500 font-bold tracking-wide uppercase text-sm group/link">
                                    Read Full Release
                                    <ChevronRight className="w-4 h-4 transform group-hover/link:translate-x-1 group-hover/link:text-white transition-all" />
                                </button>
                            </motion.article>
                        ))}
                    </motion.div>
                </section>

                {/* Contact Section */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 p-12 md:p-16 text-center"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-red-900/10 to-transparent pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.1)] mb-8 transform -rotate-6">
                            <Newspaper className="w-10 h-10 text-red-500" />
                        </div>

                        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">Media Inquiries</h2>
                        <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed mb-8">
                            Are you a journalist looking for a quote, interview, or platform exclusive? Reach out to our communications team directly.
                        </p>

                        <a
                            href="mailto:press@naijamation.com"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-lg rounded-xl transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]"
                        >
                            press@naijamation.com
                        </a>
                    </div>
                </motion.section>
            </div>
        </div>
    );
}
