import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SEO } from "../components/SEO";
import { useCatalog } from "../context/CatalogProvider";
import { Film } from "../lib/catalog";
import { Play, Disc, Music as MusicIcon, Flame, Clock } from "lucide-react";

export default function Music() {
    const navigate = useNavigate();
    const { filmCatalog } = useCatalog();
    const [musicContent, setMusicContent] = useState<Film[]>([]);

    useEffect(() => {
        if (filmCatalog) {
            const filtered = filmCatalog.filter(
                (film) =>
                    film.tags?.toLowerCase().includes("music") ||
                    film.tags?.toLowerCase().includes("concert") ||
                    film.tags?.toLowerCase().includes("afrobeat") ||
                    film.genre?.toLowerCase().includes("music")
            );
            setMusicContent(filtered);
        }
    }, [filmCatalog]);

    const handlePlayClick = (id: string) => {
        navigate(`/watch/${id}`);
    };

    // Sections
    const featured = musicContent.slice(0, 1)[0];
    const newReleases = [...musicContent].sort((a, b) => b.release_year - a.release_year).slice(0, 5);
    const topHits = [...musicContent].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5);
    const afrobeat = musicContent.filter(f => f.tags?.toLowerCase().includes('afrobeat')).slice(0, 5);

    const renderVideoCard = (film: Film, variant: 'square' | 'wide' = 'square') => (
        <div
            key={film.id}
            className="group relative cursor-pointer flex-shrink-0"
            onClick={() => handlePlayClick(film.id)}
        >
            <div className={`overflow-hidden rounded-xl bg-gray-800 ${variant === 'wide' ? 'aspect-video w-64' : 'aspect-square w-48 lg:w-56'} relative`}>
                <img
                    src={film.poster_url || '/placeholder.jpg'}
                    alt={film.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="bg-red-600/90 text-white rounded-full p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg shadow-red-600/50">
                        <Play className="h-6 w-6 fill-current ml-1" />
                    </div>
                </div>
            </div>
            <div className="mt-3 w-full">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{film.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 truncate">
                    <Disc className="h-3.5 w-3.5" />
                    {film.artist || film.director || 'Various Artists'}
                </p>
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-[#0a0a0a] min-h-screen pt-14 lg:pl-60">
            <SEO title="Music & Audio" description="Discover hit music videos, afrobeat, concerts, and exclusive audio tracks." />

            {/* Dynamic Hero */}
            <div className="relative h-[45vh] lg:h-[55vh] w-full overflow-hidden">
                {featured ? (
                    <>
                        <div className="absolute inset-0">
                            <img
                                src={featured.poster_url || '/placeholder.jpg'}
                                alt="Featured Music"
                                className="w-full h-full object-cover opacity-60 dark:opacity-40"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0a0a0a] via-white/50 dark:via-[#0a0a0a]/50 to-transparent" />
                            <div className="absolute inset-0 bg-gradient-to-r from-red-900/40 to-transparent" />
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12 max-w-7xl mx-auto">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-500 font-bold tracking-wider text-sm mb-4 uppercase">
                                <MusicIcon className="h-5 w-5" />
                                Featured Release
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-black text-gray-900 dark:text-white mb-4 drop-shadow-lg leading-tight">
                                {featured.title}
                            </h1>
                            <p className="text-lg text-gray-800 dark:text-gray-200 mb-8 max-w-2xl font-medium drop-shadow">
                                {featured.logline || "Experience the best in Nigerian music and exclusive visualizer premieres."}
                            </p>
                            <button
                                onClick={() => handlePlayClick(featured.id)}
                                className="flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-lg transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(220,38,38,0.4)]"
                            >
                                <Play className="h-6 w-6 fill-current" />
                                Listen Now
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <div className="animate-pulse bg-gray-800 h-12 w-1/3 rounded-full"></div>
                    </div>
                )}
            </div>

            {/* Music Rows */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">

                {/* Hot New Releases */}
                {newReleases.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                <Flame className="h-6 w-6 text-red-600 dark:text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Hot New Releases</h2>
                        </div>
                        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
                            {newReleases.map(f => renderVideoCard(f, 'square'))}
                        </div>
                    </section>
                )}

                {/* Top Charts */}
                {topHits.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Clock className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Top Charts</h2>
                        </div>
                        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
                            {topHits.map((f, i) => (
                                <div key={f.id} className="flex gap-4 items-center min-w-[300px] cursor-pointer group" onClick={() => handlePlayClick(f.id)}>
                                    <div className="text-4xl font-black text-gray-200 dark:text-gray-800 w-12 text-center group-hover:text-red-600 transition-colors">
                                        {i + 1}
                                    </div>
                                    <div className="relative h-20 w-20 rounded-md overflow-hidden flex-shrink-0">
                                        <img src={f.poster_url || '/placeholder.jpg'} alt="" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Play className="h-6 w-6 text-white fill-current" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1">{f.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{f.artist || f.director || 'Artist'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Afrobeat Essentials */}
                {afrobeat.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Disc className="h-6 w-6 text-green-600 dark:text-green-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Afrobeat Essentials</h2>
                        </div>
                        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
                            {afrobeat.map(f => renderVideoCard(f, 'wide'))}
                        </div>
                    </section>
                )}

            </div>
        </div>
    );
}
