import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie, TVShow } from '../types';
import { ContentCard } from './ContentCard';
import { useRef, useState } from 'react';

interface ContentRowProps {
  title: string;
  content: (Movie | TVShow)[];
  type: 'movie' | 'tv_show';
  onPlayClick: (item: Movie | TVShow) => void;
}

export function ContentRow({ title, content, type, onPlayClick }: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.8;
      const newScrollLeft =
        direction === 'left'
          ? scrollRef.current.scrollLeft - scrollAmount
          : scrollRef.current.scrollLeft + scrollAmount;

      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });

      setTimeout(() => {
        if (scrollRef.current) {
          setShowLeftArrow(scrollRef.current.scrollLeft > 0);
          setShowRightArrow(
            scrollRef.current.scrollLeft <
              scrollRef.current.scrollWidth - scrollRef.current.clientWidth - 10
          );
        }
      }, 300);
    }
  };

  return (
    <div className="space-y-4 mb-12">
      <h2 className="text-2xl font-bold text-white px-4">{title}</h2>

      <div className="relative group">
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-slate-950/80 text-white rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex space-x-4 overflow-x-auto scrollbar-hide px-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {content.map((item) => (
            <div key={item.id} className="flex-none w-64">
              <ContentCard
                content={item}
                type={type}
                onPlayClick={() => onPlayClick(item)}
              />
            </div>
          ))}
        </div>

        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-slate-950/80 text-white rounded-l-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-900"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </div>
    </div>
  );
}
