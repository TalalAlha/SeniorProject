/**
 * CompanyProfile — Company settings and profile page (/company/profile).
 *
 * Allows company admins to view and edit their organisation's details:
 *  - Name (English + Arabic), description, contact email, phone, website
 *  - Location (country, city, address)
 *  - Industry and company size
 *  - Subscription status and dates (read-only, managed by super-admin)
 *
 * Changes are saved via PATCH /api/v1/companies/{id}/.
 * The company ID is read from the authenticated user's company field.
 *
 * Requires COMPANY_ADMIN role.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User,
  Mail,
  Lock,
  Globe,
  Save,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Shield,
  Calendar,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Edit2,
} from 'lucide-react';
import { useAuth } from '../../contexts';
import { authAPI } from '../../api';
import HelpTooltip from '../../components/common/HelpTooltip';
import { changeLanguage } from '../../i18n';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import PasswordRequirements from '../../components/PasswordRequirements';
import { isPasswordValid } from '../../utils/passwordValidation';

// Password strength checker
const getPasswordStrength = (password) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  if (strength <= 1) return { labelKey: 'profile.passwordWeak', color: 'danger', width: '20%' };
  if (strength <= 2) return { labelKey: 'profile.passwordFair', color: 'warning', width: '40%' };
  if (strength <= 3) return { labelKey: 'profile.passwordGood', color: 'yellow', width: '60%' };
  if (strength <= 4) return { labelKey: 'profile.passwordStrong', color: 'success', width: '80%' };
  return { labelKey: 'profile.passwordVeryStrong', color: 'success', width: '100%' };
};

function CompanyProfile() {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    preferred_language: 'en',
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const [passwordErrors, setPasswordErrors] = useState({});

  // Fetch profile on mount
  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.getProfile();
      const data = response.data;
      setProfile(data);
      setProfileData({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        preferred_language: data.preferred_language || 'en',
      });
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load profile';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      await authAPI.updateProfile(profileData);

      // Update local language if changed
      if (profileData.preferred_language !== i18n.language) {
        changeLanguage(profileData.preferred_language);
      }

      // Refresh profile and user context
      await fetchProfile();
      if (refreshUser) await refreshUser();

      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to update profile';
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setProfileData({
      first_name: profile?.first_name || '',
      last_name: profile?.last_name || '',
      preferred_language: profile?.preferred_language || 'en',
    });
    setIsEditing(false);
  };

  // Validate password
  const validatePassword = () => {
    const errors = {};

    if (!passwordData.old_password) {
      errors.old_password = 'Current password is required';
    }

    if (!passwordData.new_password) {
      errors.new_password = 'New password is required';
    } else if (!isPasswordValid(passwordData.new_password)) {
      errors.new_password = 'Password does not meet all requirements';
    }

    if (!passwordData.confirm_password) {
      errors.confirm_password = 'Please confirm your new password';
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = 'Passwords do not match';
    }

    if (passwordData.old_password === passwordData.new_password && passwordData.new_password) {
      errors.new_password = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!validatePassword()) return;

    setSavingPassword(true);

    try {
      await authAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password,
      });

      setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
      setPasswordErrors({});
      toast.success('Password changed successfully');
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.old_password?.[0] || 'Failed to change password';
      toast.error(message);
      if (err.response?.data?.old_password) {
        setPasswordErrors({ old_password: 'Current password is incorrect' });
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const passwordStrength = getPasswordStrength(passwordData.new_password);

  const getInitials = () => {
    const first = profile?.first_name?.[0] || user?.first_name?.[0] || '';
    const last = profile?.last_name?.[0] || user?.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button onClick={fetchProfile} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('admin.common.tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>
          <HelpTooltip i18nKey="tooltips.companyProfile" />
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-1">{t('profile.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info & Security */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-5 w-5 text-primary-600" />
                {t('profile.profileInformation')}
              </h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  {t('common.edit')}
                </button>
              ) : (
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <form onSubmit={handleProfileUpdate}>
              {/* Avatar & Basic Info */}
              <div className="flex items-center gap-6 pb-6 border-b border-gray-200 dark:border-gray-700 mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg dark:shadow-gray-900/50">
                  {getInitials()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {profile?.first_name} {profile?.last_name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {profile?.email}
                  </p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">{t('auth.firstName')}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                        className="input"
                        disabled={savingProfile}
                      />
                    ) : (
                      <p className="input bg-gray-50 dark:bg-gray-700">{profile?.first_name || '-'}</p>
                    )}
                  </div>
                  <div>
                    <label className="label">{t('auth.lastName')}</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                        className="input"
                        disabled={savingProfile}
                      />
                    ) : (
                      <p className="input bg-gray-50 dark:bg-gray-700">{profile?.last_name || '-'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="label">{t('auth.email')}</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="input bg-gray-50 dark:bg-gray-700 pr-10"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('profile.emailCannotBeChanged')}</p>
                </div>

                <div>
                  <label className="label">{t('profile.company')}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profile?.company_name || profile?.company?.name || 'N/A'}
                      disabled
                      className="input bg-gray-50 dark:bg-gray-700 pr-10"
                    />
                    <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                  </div>
                </div>

                <div>
                  <label className="label">{t('common.language')}</label>
                  {isEditing ? (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setProfileData({ ...profileData, preferred_language: 'en' })}
                        disabled={savingProfile}
                        className={clsx(
                          'flex-1 px-4 py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2',
                          profileData.preferred_language === 'en'
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                      >
                        <Globe className="h-4 w-4" />
                        {t('common.english')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setProfileData({ ...profileData, preferred_language: 'ar' })}
                        disabled={savingProfile}
                        className={clsx(
                          'flex-1 px-4 py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2',
                          profileData.preferred_language === 'ar'
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        )}
                      >
                        <Globe className="h-4 w-4" />
                        {t('common.arabic')}
                      </button>
                    </div>
                  ) : (
                    <p className="input bg-gray-50 dark:bg-gray-700">
                      {profile?.preferred_language === 'ar' ? t('common.arabic') : t('common.english')}
                    </p>
                  )}
                </div>
              </div>

              {/* Save/Cancel Buttons */}
              {isEditing && (
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="btn-primary flex items-center gap-2"
                  >
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {t('profile.saveChanges')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={savingProfile}
                    className="btn-secondary"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Change Password Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary-600" />
              {t('profile.changePassword')}
            </h2>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="label">{t('profile.currentPassword')}</label>
                <div className="relative">
                  <input
                    type={showPasswords.old ? 'text' : 'password'}
                    value={passwordData.old_password}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, old_password: e.target.value });
                      setPasswordErrors({ ...passwordErrors, old_password: undefined });
                    }}
                    className={clsx('input pr-10', passwordErrors.old_password && 'border-danger-500')}
                    disabled={savingPassword}
                    placeholder={t('profile.enterCurrentPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, old: !showPasswords.old })}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.old ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordErrors.old_password && (
                  <p className="text-sm text-danger-600 mt-1">{passwordErrors.old_password}</p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className="label">{t('profile.newPassword')}</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.new_password}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, new_password: e.target.value });
                      setPasswordErrors({ ...passwordErrors, new_password: undefined });
                    }}
                    className={clsx('input pr-10', passwordErrors.new_password && 'border-danger-500')}
                    disabled={savingPassword}
                    placeholder={t('profile.enterNewPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordErrors.new_password && (
                  <p className="text-sm text-danger-600 mt-1">{passwordErrors.new_password}</p>
                )}

                {/* Password Strength Indicator */}
                {passwordData.new_password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-500 dark:text-gray-400">{t('profile.passwordStrengthLabel')}</span>
                      <span className={clsx(
                        'font-medium',
                        passwordStrength.color === 'danger' && 'text-danger-600',
                        passwordStrength.color === 'warning' && 'text-warning-600',
                        passwordStrength.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
                        passwordStrength.color === 'success' && 'text-success-600'
                      )}>
                        {t(passwordStrength.labelKey)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all',
                          passwordStrength.color === 'danger' && 'bg-danger-500',
                          passwordStrength.color === 'warning' && 'bg-warning-500',
                          passwordStrength.color === 'yellow' && 'bg-yellow-500',
                          passwordStrength.color === 'success' && 'bg-success-500'
                        )}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label">{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirm_password}
                    onChange={(e) => {
                      setPasswordData({ ...passwordData, confirm_password: e.target.value });
                      setPasswordErrors({ ...passwordErrors, confirm_password: undefined });
                    }}
                    className={clsx('input pr-10', passwordErrors.confirm_password && 'border-danger-500')}
                    disabled={savingPassword}
                    placeholder={t('profile.confirmNewPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {passwordErrors.confirm_password && (
                  <p className="text-sm text-danger-600 mt-1">{passwordErrors.confirm_password}</p>
                )}
                {passwordData.confirm_password && passwordData.new_password === passwordData.confirm_password && (
                  <p className="text-sm text-success-600 mt-1 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {t('auth.passwordsMatch') || 'Passwords match'}
                  </p>
                )}
              </div>

              <PasswordRequirements password={passwordData.new_password} />

              <button
                type="submit"
                disabled={savingPassword || !passwordData.old_password || !passwordData.new_password || !passwordData.confirm_password}
                className="btn-primary flex items-center gap-2"
              >
                {savingPassword ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                {t('profile.changePassword')}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Account Info */}
        <div className="space-y-6">
          {/* Account Info Card */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary-600" />
              {t('profile.accountInfo')}
            </h2>

            <div className="space-y-4">
              {/* Role */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('profile.role')}</p>
                <span className={clsx(
                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
                  profile?.role === 'EMPLOYEE' && 'bg-primary-100 text-primary-700',
                  profile?.role === 'COMPANY_ADMIN' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
                  profile?.role === 'SUPER_ADMIN' && 'bg-danger-100 text-danger-700'
                )}>
                  <Shield className="h-3 w-3" />
                  {profile?.role?.replace('_', ' ') || 'Company Admin'}
                </span>
              </div>

              {/* Company */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('profile.company')}</p>
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  {profile?.company_name || profile?.company?.name || 'N/A'}
                </p>
              </div>

              {/* Member Since */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('profile.memberSince')}</p>
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  {formatDate(profile?.date_joined || profile?.created_at)}
                </p>
              </div>

              {/* Account Status */}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('profile.accountStatus')}</p>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-success-100 text-success-700">
                  <CheckCircle className="h-3 w-3" />
                  {t('common.active')}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Language Switch */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary-600" />
              {t('profile.quickLanguageSwitch')}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => changeLanguage('en')}
                className={clsx(
                  'flex-1 px-3 py-2 rounded-lg border-2 transition-colors text-sm',
                  i18n.language === 'en'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {t('common.english')}
              </button>
              <button
                onClick={() => changeLanguage('ar')}
                className={clsx(
                  'flex-1 px-3 py-2 rounded-lg border-2 transition-colors text-sm',
                  i18n.language === 'ar'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {t('common.arabic')}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {t('profile.languageSwitchNote')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompanyProfile;
