/**
 * RegisterCompany — Company self-registration page (/register-company).
 *
 * Allows a new organisation to sign up as a company admin. Creates both
 * the Company record and the first COMPANY_ADMIN user in one request.
 *
 * Form fields:
 *  - Company name, industry, company size
 *  - Admin first name, last name, email, password
 *  - Preferred language (English / Arabic)
 *
 * On success, shows a verification prompt (email is sent automatically).
 * The new company starts with an inactive subscription until a super-admin activates it.
 *
 * API call:
 *   POST /api/v1/companies/register/   → create company + admin user + send verification email
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, User, Mail, Lock, Globe, Eye, EyeOff, CheckCircle, RefreshCw } from 'lucide-react';
import Logo from '../../components/Logo';
import PasswordRequirements from '../../components/PasswordRequirements';
import { isPasswordValid } from '../../utils/passwordValidation';
import { toast } from 'react-hot-toast';
import { companiesAPI, authAPI } from '../../api';

const RegisterCompany = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const [resendLoading, setResendLoading] = useState(false);

  const [formData, setFormData] = useState({
    company_name: '',
    company_website: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_password: '',
    confirm_password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.admin_password !== formData.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }

    if (!isPasswordValid(formData.admin_password)) {
      toast.error('Password does not meet all requirements');
      return;
    }

    setLoading(true);

    try {
      const { confirm_password, ...submitData } = formData;
      await companiesAPI.registerCompany(submitData);
      setRegisteredEmail(formData.admin_email);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
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

  // ── Check-your-email screen (after successful registration) ──────────────
  if (registeredEmail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 max-w-md w-full p-8 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-1">We sent a verification link to:</p>
          <p className="font-semibold text-blue-600 dark:text-blue-400 text-lg mb-6">{registeredEmail}</p>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg p-4 mb-6 text-sm text-blue-800 dark:text-blue-300 text-left">
            <p>
              Click the link in the email to activate your account and access your
              company dashboard. The link expires in <strong>24 hours</strong>.
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4 transition-colors">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 max-w-2xl w-full p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <Logo variant="vertical" className="h-24 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Register Your Company</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Create your company account and start protecting your team</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Company Information */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Company Information
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                placeholder="Acme Corporation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Website <span className="text-gray-400 dark:text-gray-500">(optional)</span>
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="url"
                  name="company_website"
                  value={formData.company_website}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>

          {/* Admin Account */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              Admin Account
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="admin_first_name"
                  value={formData.admin_first_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="John"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="admin_last_name"
                  value={formData.admin_last_name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type="email"
                  name="admin_email"
                  value={formData.admin_email}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="admin@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="admin_password"
                  value={formData.admin_password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="Min. 8 characters"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                  placeholder="Confirm password"
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

            <PasswordRequirements password={formData.admin_password} />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating Account…' : 'Create Company Account'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterCompany;
