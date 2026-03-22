import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts';

// Loading spinner component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  );
}

// Protected route component
export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, loading, user, hasAnyRole } = useAuth();
  const location = useLocation();

  // Show loading while checking auth status
  if (loading) {
    return <LoadingSpinner />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    // Redirect to appropriate dashboard based on user role
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

// Public route - redirects to dashboard if already authenticated
export function PublicRoute({ children }) {
  const { isAuthenticated, loading, getDashboardPath } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  // If authenticated, redirect to dashboard
  if (isAuthenticated) {
    const from = location.state?.from?.pathname || getDashboardPath();
    return <Navigate to={from} replace />;
  }

  return children;
}

// Guest route - accessible to both authenticated and unauthenticated users
export function GuestRoute({ children }) {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return children;
}

export default ProtectedRoute;
