interface AdSpaceProps {
  variant?: 'banner' | 'rectangle' | 'leaderboard' | 'sidebar';
  className?: string;
}

export function AdSpace({ variant = 'banner', className = '' }: AdSpaceProps) {
  const adSizes = {
    banner: 'h-24 md:h-32',
    rectangle: 'h-64 w-full max-w-sm mx-auto',
    leaderboard: 'h-20 md:h-24',
    sidebar: 'h-96 w-full',
  };

  const adLabels = {
    banner: 'Advertisement - 728x90',
    rectangle: 'Advertisement - 300x250',
    leaderboard: 'Advertisement - 728x90',
    sidebar: 'Advertisement - 160x600',
  };

  return (
    <div className={`${adSizes[variant]} ${className}`}>
      <div className="w-full h-full bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {adLabels[variant]}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Ad space reserved
          </p>
        </div>
      </div>
    </div>
  );
}
