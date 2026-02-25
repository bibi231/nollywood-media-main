import { ReactNode } from 'react';
import { Film, Search, Bookmark, Clock, Upload, ListMusic, Users, FileText } from 'lucide-react';

interface EmptyStateProps {
    icon?: 'film' | 'search' | 'bookmark' | 'clock' | 'upload' | 'playlist' | 'users' | 'document';
    title: string;
    description?: string;
    action?: ReactNode;
}

const ICONS = {
    film: Film,
    search: Search,
    bookmark: Bookmark,
    clock: Clock,
    upload: Upload,
    playlist: ListMusic,
    users: Users,
    document: FileText,
};

export function EmptyState({ icon = 'film', title, description, action }: EmptyStateProps) {
    const Icon = ICONS[icon];

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-gray-800/50 flex items-center justify-center mb-5 ring-1 ring-white/5">
                <Icon className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2 text-center">{title}</h3>
            {description && (
                <p className="text-sm text-gray-500 text-center max-w-sm mb-6">{description}</p>
            )}
            {action && <div>{action}</div>}
        </div>
    );
}
