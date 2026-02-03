import { Outlet, Link, useLocation } from 'react-router-dom';
import { BarChart3, Film, Users, MessageSquare, DollarSign, Settings, Home } from 'lucide-react';

export function StudioLayout() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path);

  const navItems = [
    { path: '/studio', icon: BarChart3, label: 'Dashboard', exact: true },
    { path: '/studio/content', icon: Film, label: 'Content' },
    { path: '/studio/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/studio/subscribers', icon: Users, label: 'Subscribers' },
    { path: '/studio/comments', icon: MessageSquare, label: 'Comments' },
    { path: '/studio/earn', icon: DollarSign, label: 'Earn' },
    { path: '/studio/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <Home className="h-5 w-5" />
                <span className="text-sm font-medium">Home</span>
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Creator Studio
              </h1>
            </div>
            <Link
              to="/account/upload"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
            >
              Upload Content
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen sticky top-16">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const active = item.exact
                ? location.pathname === item.path
                : isActive(item.path);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    active
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
