import { Outlet, Link, useLocation } from 'react-router-dom';
import { User, Clock, Bookmark, Upload, Film, Settings, Bell, CreditCard, Home } from 'lucide-react';

export function AccountLayout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/account/profile', icon: User, label: 'Profile' },
    { path: '/account/watchlist', icon: Bookmark, label: 'My Watchlist' },
    { path: '/account/history', icon: Clock, label: 'Watch History' },
    { path: '/account/upload', icon: Upload, label: 'Upload Content' },
    { path: '/account/my-uploads', icon: Film, label: 'My Uploads' },
  ];

  const settingsItems = [
    { path: '/account/notifications', icon: Bell, label: 'Notifications' },
    { path: '/account/subscription', icon: CreditCard, label: 'Subscription' },
    { path: '/account/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pt-14 lg:pl-60">
      <div className="px-4 sm:px-6 py-6">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                My Account
              </h1>
            </div>
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your profile, content, and preferences
          </p>
        </div>

        <div className="flex gap-6">
          <aside className="w-64 flex-shrink-0 hidden md:block">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sticky top-20">
              <h2 className="mb-4 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Content
              </h2>
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                      isActive(item.path)
                        ? 'bg-red-600 text-white font-medium shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:translate-x-1'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Settings
                </h3>
                <nav className="space-y-1">
                  {settingsItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                        isActive(item.path)
                          ? 'bg-red-600 text-white font-medium shadow-sm'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:translate-x-1'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
