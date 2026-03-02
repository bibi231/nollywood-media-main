import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
    Shield,
    LayoutDashboard,
    Flag,
    Users,
    Home,
    LogOut,
    MessageSquare,
    AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function ModeratorLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { signOut } = useAuth();

    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const navItems = [
        { path: '/moderator/dashboard', icon: LayoutDashboard, label: 'Command Center', exact: true },
        { path: '/moderator/reports', icon: Flag, label: 'Safety Queue' },
        { path: '/moderator/monetization', icon: Users, label: 'Partner Reviews' },
        { path: '/moderator/users', icon: AlertTriangle, label: 'User Oversight' },
        { path: '/moderator/chat', icon: MessageSquare, label: 'Mod Chat' },
    ];

    return (
        <div className="flex min-h-screen bg-slate-950">
            <aside className="w-72 border-r border-white/5 bg-slate-900/50 backdrop-blur-xl">
                <div className="flex h-20 items-center justify-center border-b border-white/5 px-6 gap-3">
                    <Shield className="h-8 w-8 text-red-600" />
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-white uppercase tracking-tighter leading-none">Safehub</span>
                        <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest leading-none mt-1">Moderator</span>
                    </div>
                </div>

                <nav className="space-y-1 p-6">
                    <Link
                        to="/"
                        className="flex items-center space-x-3 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-white/5 hover:text-white transition-all group"
                    >
                        <Home className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Return Home</span>
                    </Link>

                    <div className="my-6 border-t border-white/5 mx-2"></div>

                    {navItems.map((item) => {
                        const isCurrentlyActive = item.exact
                            ? location.pathname === item.path
                            : isActive(item.path);

                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center space-x-3 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${isCurrentlyActive
                                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20 translate-x-1'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    <div className="my-6 border-t border-white/5 mx-2"></div>

                    <button
                        onClick={handleSignOut}
                        className="flex w-full items-center space-x-3 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-red-600/10 hover:text-red-500 transition-all"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Terminate Session</span>
                    </button>
                </nav>
            </aside>

            <main className="flex-1 overflow-auto bg-slate-950 custom-scrollbar">
                <Outlet />
            </main>
        </div>
    );
}
