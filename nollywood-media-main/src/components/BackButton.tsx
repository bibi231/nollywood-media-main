import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BackButtonProps {
    fallback?: string;
    label?: string;
    className?: string;
}

export function BackButton({ fallback = '/', label = 'Back', className = '' }: BackButtonProps) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate(fallback);
        }
    };

    return (
        <button
            onClick={handleBack}
            className={`inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-500 transition-colors text-sm ${className}`}
        >
            <ChevronLeft className="w-4 h-4" />
            <span>{label}</span>
        </button>
    );
}
