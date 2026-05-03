/**
 * App — Root application component.
 *
 * Wraps the entire app in AuthProvider (auth state) and RouterProvider (routing).
 * Also renders the global Toaster with dark-mode-aware styles so every page can
 * fire toast notifications without additional setup.
 */
import { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { AuthProvider } from './contexts';
import { useTheme } from './contexts/ThemeContext';
import router from './routes';
import './i18n';

/**
 * LoadingFallback — Centered spinner shown while lazy-loaded route chunks are fetching.
 */
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

/**
 * App — Reads the active theme and passes dark-mode colours into react-hot-toast config.
 */
function App() {
  // Read global dark/light mode so the toast styles match the current theme
  const { isDark } = useTheme();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: isDark ? '#1E293B' : '#fff',
              color: isDark ? '#F1F5F9' : '#333',
              boxShadow: isDark
                ? '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)'
                : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              borderRadius: '0.75rem',
              padding: '1rem',
              cursor: 'pointer',
              border: isDark ? '1px solid #334155' : 'none',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <div
                  style={{ display: 'contents' }}
                  onClick={() => toast.dismiss(t.id)}
                >
                  {icon}
                  {message}
                </div>
              )}
            </ToastBar>
          )}
        </Toaster>
      </AuthProvider>
    </Suspense>
  );
}

export default App;
