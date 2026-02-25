import { Search, Menu, Film, User, Bell, Video, BarChart3, History } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from './AuthModal';
import { supabase } from '../lib/supabase';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch unread notification count
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);

        if (!error && count !== null) {
          setUnreadCount(count);
        }
      } catch (err) {
        console.error('Error fetching notification count:', err);
      }
    };

    fetchUnreadCount();

    // Subscribe to realtime notification changes
    const channel = supabase
      .channel('notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Close user menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
      <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors lg:hidden"
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>
            <Link to="/" className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Film className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              <span className="text-lg sm:text-xl font-semibold text-gray-900 truncate max-w-[120px] sm:max-w-none">NaijaMation</span>
            </Link>
          </div>

          <div className="flex-1 max-w-2xl mx-4 hidden sm:block">
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="flex w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-full focus:outline-none focus:border-blue-500 text-gray-900"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-full hover:bg-gray-200 transition-colors"
                >
                  <Search className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </form>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <button className="p-2 hover:bg-gray-100 rounded-full sm:hidden" title="Search">
              <Search className="w-5 h-5 text-gray-700" />
            </button>
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Admin Dashboard"
                  >
                    <Video className="w-6 h-6 text-gray-700" />
                  </Link>
                )}
                <Link
                  to="/account/notifications"
                  className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Notifications"
                >
                  <Bell className="w-6 h-6 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-600 rounded-full">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold hover:bg-red-700 transition-colors"
                  >
                    {user.email?.charAt(0).toUpperCase()}
                  </button>
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-900">{user.email?.split('@')[0]}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/account/profile"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        <User className="w-5 h-5" />
                        <span className="text-sm">My Account</span>
                      </Link>
                      <Link
                        to="/account/watchlist"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        <Video className="w-5 h-5" />
                        <span className="text-sm">My Watchlist</span>
                      </Link>
                      <Link
                        to="/account/history"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        <History className="w-5 h-5" />
                        <span className="text-sm">Watch History</span>
                      </Link>
                      <Link
                        to="/account/notifications"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        <Bell className="w-5 h-5" />
                        <span className="text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="ml-auto text-xs font-bold text-white bg-red-600 rounded-full px-1.5 py-0.5">
                            {unreadCount}
                          </span>
                        )}
                      </Link>
                      <Link
                        to="/studio"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-gray-700"
                      >
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-sm">Creator Studio</span>
                      </Link>
                      <div className="border-t border-gray-200 my-2"></div>
                      <button
                        onClick={async () => {
                          setShowUserMenu(false);
                          await signOut();
                          navigate('/');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm text-gray-700"
                      >
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-600">Sign in</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
