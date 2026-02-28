import { Home, Compass, Film, Tv, Music, Sparkles, X, TrendingUp, Clock, Upload, Star, Smartphone } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const mainLinks = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Smartphone, label: 'Clips', path: '/clips' },
    { icon: Compass, label: 'Explore', path: '/catalog' },
    { icon: TrendingUp, label: 'Trending', path: '/trending' },
    { icon: Clock, label: 'Continue Watching', path: '/continue-watching' },
  ];

  const contentLinks = [
    { icon: Film, label: 'Movies', path: '/content/film' },
    { icon: Tv, label: 'Series', path: '/content/series' },
    { icon: Sparkles, label: 'Anime', path: '/content/anime' },
    { icon: Music, label: 'Music', path: '/content/music' },
  ];

  const creatorLinks = [
    { icon: Upload, label: 'Upload Content', path: '/account/upload' },
    { icon: Star, label: 'My Uploads', path: '/account/my-uploads' },
  ];

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <>
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-14 bottom-0 w-60 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          overflow-y-auto scrollbar-thin z-50 transition-transform duration-300
          ${isMobile ? (isOpen ? 'translate-x-0' : '-translate-x-full') : 'lg:translate-x-0'}
        `}
      >
        {isMobile && isOpen && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="py-2">
          <div className="px-3 py-2">
            {mainLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                className={`flex items-center gap-6 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive(link.path)
                  ? 'bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:translate-x-1'
                  }`}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 my-2"></div>

          <div className="px-3 py-2">
            <h3 className="px-3 mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Browse
            </h3>
            {contentLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                className={`flex items-center gap-6 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive(link.path)
                  ? 'bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:translate-x-1'
                  }`}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{link.label}</span>
              </Link>
            ))}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 my-2"></div>

          <div className="px-3 py-2">
            <h3 className="px-3 mb-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Creator
            </h3>
            {creatorLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={handleLinkClick}
                className={`flex items-center gap-6 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive(link.path)
                  ? 'bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:translate-x-1'
                  }`}
              >
                <link.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
