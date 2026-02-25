export function SkeletonCard() {
    return (
        <div className="animate-fade-in">
            <div className="skeleton aspect-video rounded-xl mb-3" />
            <div className="space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
                <div className="flex gap-2">
                    <div className="skeleton h-3 w-16 rounded" />
                    <div className="skeleton h-3 w-12 rounded" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonRow({ count = 4 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

export function SkeletonLine({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
    return <div className={`skeleton ${width} ${height} rounded`} />;
}
