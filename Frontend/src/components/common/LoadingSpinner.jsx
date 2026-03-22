import clsx from 'clsx';

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

function LoadingSpinner({ size = 'md', className, fullScreen = false }) {
  const spinner = (
    <div
      className={clsx(
        'animate-spin rounded-full border-b-2 border-primary-600',
        sizes[size],
        className
      )}
    />
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="text-center">
          {spinner}
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;
