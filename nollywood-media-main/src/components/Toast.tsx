import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { CheckCircle, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
}

interface ToastContextType {
    addToast: (type: ToastType, message: string, duration?: number) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
}

const ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const COLORS = {
    success: 'bg-emerald-600/90 border-emerald-400/30',
    error: 'bg-red-600/90 border-red-400/30',
    warning: 'bg-amber-600/90 border-amber-400/30',
    info: 'bg-blue-600/90 border-blue-400/30',
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, type, message, duration }]);
    }, []);

    return (
        <ToastContext.Provider value={{
            addToast,
            success: (msg) => addToast('success', msg),
            error: (msg) => addToast('error', msg),
            warning: (msg) => addToast('warning', msg),
            info: (msg) => addToast('info', msg),
        }}>
            {children}
            {/* Toast Container */}
            <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
                {toasts.map(toast => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const [exiting, setExiting] = useState(false);
    const Icon = ICONS[toast.type];

    useEffect(() => {
        const timer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => onRemove(toast.id), 200);
        }, toast.duration || 4000);

        return () => clearTimeout(timer);
    }, [toast, onRemove]);

    return (
        <div
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-white text-sm font-medium min-w-[280px] max-w-[400px] ${COLORS[toast.type]} ${exiting ? 'toast-exit' : 'toast-enter'
                }`}
            style={{ backdropFilter: 'blur(12px)' }}
        >
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">{toast.message}</span>
            <button
                onClick={() => { setExiting(true); setTimeout(() => onRemove(toast.id), 200); }}
                className="flex-shrink-0 hover:bg-white/20 rounded-full p-0.5 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
