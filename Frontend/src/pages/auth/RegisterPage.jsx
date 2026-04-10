/**
 * RegisterPage — Public user self-registration page (/register).
 *
 * Creates a PUBLIC_USER account (community portal access only).
 * Company admins register via /register-company.
 * Employees are onboarded through invitation links (/accept-invitation/:token).
 *
 * On successful registration, shows an inline success state prompting the user
 * to verify their email (no redirect — avoids confusion with unverified state).
 *
 * API call:
 *   POST /api/v1/auth/register/   → create PUBLIC_USER account + send verification email
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, CheckCircle, RefreshCw, Building2 } from 'lucide-react';
import Logo from '../../components/Logo';
import { authAPI } from '../../api';

const RegisterPage = () => {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    password_confirm: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Post-registration verification state
  const [verificationSent, setVerificationSent] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    const { password_confirm, ...registerData } = formData;
    const result = await register(registerData);
    setLoading(false);

    if (result.success) {
      setRegisteredEmail(result.email || formData.email);
      setVerificationSent(true);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authAPI.resendVerification(registeredEmail);
      toast.success('Verification email resent! Check your inbox.');
    } catch {
      toast.error('Failed to resend. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  // ── Verification success screen ──────────────────────────────────────────
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg dark:shadow-gray-900/50 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check your inbox!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">We sent a verification link to:</p>
          <p className="font-semibold text-blue-600 dark:text-blue-400 text-lg mb-6">{registeredEmail}</p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6 text-sm text-blue-800 dark:text-blue-300 text-left">
            <p>
              Click the link in the email to activate your account. The link expires in
              <strong> 24 hours</strong>.
            </p>
            <p className="mt-2 text-blue-600 dark:text-blue-400">
              Can't find it? Check your <strong>spam / junk</strong> folder.
            </p>
          </div>

          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="flex items-center justify-center gap-2 mx-auto text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
            {resendLoading ? 'Sending…' : 'Resend verification email'}
          </button>

          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <Link to="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg dark:shadow-gray-900/50">
        {/* Header */}
        <div className="text-center">
          <Logo variant="vertical" className="h-24 w-auto mx-auto mb-4" />
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Create your account</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
              Sign In
            </Link>
          </p>
        </div>

        {/* Company registration callout */}
        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4">
          <Building2 className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Registering a company?{' '}
            <Link to="/register/company" className="font-semibold underline hover:text-blue-900 dark:hover:text-blue-200">
              Create a company account here
            </Link>
            . Employees should use the invitation link sent to their email.
          </p>
        </div>

        {/* Form */}
        <form className="mt-4 space-y-6" onSubmit={handleSubmit}>
          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                First Name
              </label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                value={formData.first_name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Last Name
              </label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                value={formData.last_name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" /> : <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Confirm Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password_confirm"
                name="password_confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.password_confirm}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5 text-gray-400 dark:text-gray-500" /> : <Eye className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
