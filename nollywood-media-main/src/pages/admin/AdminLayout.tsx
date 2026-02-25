import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Film, LayoutDashboard, Users, BarChart3, Settings, LogOut, Home, Upload, Flag, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const navItems = [
    { path: '/admin/cms', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/cms/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/cms/films', icon: Film, label: 'Films' },
    { path: '/admin/cms/upload', icon: Upload, label: 'Upload & Ingest' },
    { path: '/admin/cms/moderation', icon: Flag, label: 'Moderation' },
    { path: '/admin/cms/compliance', icon: Shield, label: 'Compliance' },
    { path: '/admin/cms/users', icon: Users, label: 'Users' },
    { path: '/admin/cms/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950">
      <aside className="w-64 border-r border-slate-800 bg-slate-900">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <Film className="h-6 w-6 text-red-600" />
          <span className="ml-2 text-lg font-bold text-white">Admin Panel</span>
        </div>

        <nav className="space-y-1 p-4">
          <Link
            to="/"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Back to Site</span>
          </Link>

          <div className="my-4 border-t border-slate-800"></div>

          {navItems.map((item) => {
            const isCurrentlyActive = item.exact
              ? location.pathname === item.path
              : isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-colors ${isCurrentlyActive
                    ? 'bg-red-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="my-4 border-t border-slate-800"></div>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center space-x-3 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
