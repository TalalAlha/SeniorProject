/**
 * VerifyEmailPage — Email verification landing page (/verify-email/:token).
 *
 * Automatically verifies the email address when the user clicks the link
 * in their registration confirmation email. On mount, sends the token to the API.
 *
 * Result states:
 *  - Loading  — spinner while API call is in flight
 *  - Success  — green checkmark + redirect to /login after 3 seconds
 *  - Expired  — token too old (>24 h); shows resend button
 *  - Invalid  — token not found or already used
 *
 * Token is read from the :token URL parameter via useParams().
 *
 * API calls:
 *   POST /api/v1/auth/verify-email/{token}/        → mark email as verified
 *   POST /api/v1/auth/resend-verification/         → resend verification email
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { authAPI } from '../../api';

/**
 * Handles the email-verification deep-link:
 *   /verify-email/:token
 *
 * States:
 *  verifying → success | already_verified | expired | error
 */
function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying | success | already_verified | expired | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    let cancelled = false;

    authAPI
      .verifyEmail(token)
      .then((res) => {
        if (cancelled) return;
        const data = res.data;
        if (data.already_verified) {
          setStatus('already_verified');
        } else {
          setStatus('success');
        }
        setMessage(data.message || 'Email verified successfully!');
        // Auto-redirect to login after 3 s
        setTimeout(() => {
          if (!cancelled) navigate('/login');
        }, 3000);
      })
      .catch((err) => {
        if (cancelled) return;
        const data = err.response?.data || {};
        if (data.expired) {
          setStatus('expired');
          setMessage(data.error || 'Verification link has expired.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Invalid or unknown verification token.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/50 p-8">

        {/* ── Verifying ── */}
        {status === 'verifying' && (
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifying your email…</h2>
            <p className="text-gray-500 dark:text-gray-400">Please wait a moment.</p>
          </div>
        )}

        {/* ── Success ── */}
        {(status === 'success' || status === 'already_verified') && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {status === 'already_verified' ? 'Already Verified' : 'Email Verified!'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
            <div className="inline-flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting to login…
            </div>
            <div className="mt-4">
              <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                Go to login now
              </Link>
            </div>
          </div>
        )}

        {/* ── Expired ── */}
        {status === 'expired' && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-5">
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Link Expired</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Request a new link
            </Link>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              On the login page, enter your email and use the resend option.
            </p>
          </div>
        )}

        {/* ── Error ── */}
        {status === 'error' && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verification Failed</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{message}</p>
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default VerifyEmailPage;
