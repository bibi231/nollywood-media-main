import { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
    fallbackDescription?: string;
    /** Render a minimal inline fallback instead of full-page */
    inline?: boolean;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[SectionErrorBoundary]', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (!this.state.hasError) return this.props.children;

        if (this.props.inline) {
            return (
                <div className="flex items-center gap-3 p-4 bg-red-950/20 border border-red-900/30 rounded-lg text-sm text-red-400">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span>{this.props.fallbackTitle || 'Something went wrong in this section'}</span>
                    <button
                        onClick={this.handleRetry}
                        className="ml-auto flex items-center gap-1 text-xs px-2 py-1 bg-red-900/30 rounded hover:bg-red-900/50 transition-colors"
                    >
                        <RefreshCw className="h-3 w-3" />
                        Retry
                    </button>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-red-950/30 flex items-center justify-center mb-5 ring-1 ring-red-900/30">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-200 mb-2 text-center">
                    {this.props.fallbackTitle || 'Something went wrong'}
                </h3>
                <p className="text-sm text-gray-500 text-center max-w-sm mb-6">
                    {this.props.fallbackDescription || 'An error occurred while loading this section. Please try again.'}
                </p>
                <button
                    onClick={this.handleRetry}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                    <RefreshCw className="h-4 w-4" />
                    Try Again
                </button>
                {import.meta.env.DEV && this.state.error && (
                    <pre className="mt-4 p-3 bg-gray-900 rounded text-xs text-gray-400 max-w-lg overflow-auto">
                        {this.state.error.message}
                    </pre>
                )}
            </div>
        );
    }
}
