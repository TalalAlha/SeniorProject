import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, Check, X, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeesAPI } from '../../api';

/**
 * Accept an employee invitation.
 * Route: /accept-invitation/:token
 *
 * Flow:
 *   loading → (error: invalid/expired/accepted) | form → success → /login
 */
function AcceptInvitation() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [pageState, setPageState] = useState('loading'); // loading | form | error | success
  const [invitationDetails, setInvitationDetails] = useState(null);
  const [errorInfo, setErrorInfo] = useState({ message: '', type: '' });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorInfo({ message: 'No invitation token provided.', type: 'invalid' });
      setPageState('error');
      return;
    }

    employeesAPI
      .getInvitationDetails(token)
      .then((res) => {
        setInvitationDetails(res.data);
        setPageState('form');
      })
      .catch((err) => {
        const data = err.response?.data || {};
        let type = 'invalid';
        if (data.expired) type = 'expired';
        else if (data.already_accepted) type = 'accepted';
        setErrorInfo({ message: data.error || 'Invalid invitation link.', type });
        setPageState('error');
      });
  }, [token]);

  const handleAccept = async (e) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await employeesAPI.acceptInvitation(token, { password });
      setPageState('success');
      toast.success('Account activated! Redirecting to login…');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to accept invitation. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (pageState === 'error') {
    const messages = {
      expired: {
        title: 'Invitation Expired',
        body: 'This invitation link has expired (valid for 7 days). Please ask your admin to send a new invitation.',
      },
      accepted: {
        title: 'Already Accepted',
        body: 'This invitation has already been used. You can log in with your existing account.',
      },
      invalid: {
        title: 'Invalid Invitation',
        body: errorInfo.message || 'This invitation link is invalid or no longer exists.',
      },
    };

    const info = messages[errorInfo.type] || messages.invalid;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-danger-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-danger-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{info.title}</h2>
          <p className="text-gray-600 mb-6">{info.body}</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary px-6 py-2"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Activated!</h2>
          <p className="text-gray-600">Redirecting you to the login page…</p>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  const { company_name, email, first_name, last_name } = invitationDetails || {};
  const displayName = [first_name, last_name].filter(Boolean).join(' ') || email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">You're Invited!</h2>
          <p className="text-gray-600 mt-1">
            Join <span className="font-semibold text-gray-900">{company_name}</span> on PhishAware
          </p>
        </div>

        {/* Invitation details */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6 space-y-1">
          <p className="text-sm text-primary-800">
            <span className="font-medium">Name:</span> {displayName}
          </p>
          <p className="text-sm text-primary-800">
            <span className="font-medium">Email:</span> {email}
          </p>
          <p className="text-sm text-primary-800">
            <span className="font-medium">Company:</span> {company_name}
          </p>
        </div>

        {/* Password form */}
        <form onSubmit={handleAccept} className="space-y-4">
          <div>
            <label className="label">Create Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input pr-10"
                placeholder="Re-enter password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={() => setShowConfirmPassword((v) => !v)}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Activating…
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Accept & Activate Account
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AcceptInvitation;
