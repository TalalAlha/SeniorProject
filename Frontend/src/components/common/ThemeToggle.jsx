/**
 * ThemeToggle — Dark/light mode toggle control.
 *
 * Three visual variants:
 *  - 'icon'   — compact icon button (Moon/Sun)
 *  - 'switch' — iOS-style toggle switch with Sun/Moon flanking icons
 *  - default  — labelled button showing the opposite mode name
 *
 * @param {'icon'|'switch'|string} variant - Visual style of the toggle
 */
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const ThemeToggle = ({ variant = 'icon' }) => {
  const { theme, toggleTheme } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      >
        {theme === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-400" />
        )}
      </button>
    );
  }

  if (variant === 'switch') {
    return (
      <div className="flex items-center gap-3">
        <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <button
          onClick={toggleTheme}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            theme === 'dark' ? 'bg-primary-600' : 'bg-gray-300'
          }`}
          aria-label="Toggle theme"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </div>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
      {theme === 'light' ? (
        <>
          <Moon className="w-5 h-5" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Dark Mode</span>
        </>
      ) : (
        <>
          <Sun className="w-5 h-5 text-yellow-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Light Mode</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
