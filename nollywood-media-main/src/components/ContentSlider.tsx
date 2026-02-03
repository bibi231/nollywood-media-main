import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ContentCard } from './ContentCard';
import { Film } from '../lib/catalog';
import { useNavigate } from 'react-router-dom';

interface ContentSliderProps {
  title: string;
  films: Film[];
}

export function ContentSlider({ title, films }: ContentSliderProps) {
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [films]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;

    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8;
    const newScrollLeft = direction === 'left'
      ? scrollContainerRef.current.scrollLeft - scrollAmount
      : scrollContainerRef.current.scrollLeft + scrollAmount;

    scrollContainerRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    });
  };

  const handlePlayClick = (film: Film) => {
    navigate(`/watch/${film.id}`);
  };

  if (films.length === 0) return null;

  return (
    <div className="mb-8 group/slider">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 px-4 sm:px-6 lg:px-8">
        {title}
      </h2>

      <div className="relative">
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-r from-white via-white/90 to-transparent flex items-center justify-start pl-2 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300"
            aria-label="Scroll left"
          >
            <div className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg">
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </div>
          </button>
        )}

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 bottom-0 z-10 w-12 bg-gradient-to-l from-white via-white/90 to-transparent flex items-center justify-end pr-2 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300"
            aria-label="Scroll right"
          >
            <div className="bg-white/90 hover:bg-white p-2 rounded-full shadow-lg">
              <ChevronRight className="w-6 h-6 text-gray-900" />
            </div>
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {films.map((film) => (
            <div key={film.id} className="flex-none w-64">
              <ContentCard
                content={{
                  ...film,
                  genres: [film.genre],
                  poster_url: film.poster_url || '/placeholder.jpg'
                }}
                type="movie"
                onPlayClick={() => handlePlayClick(film)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
