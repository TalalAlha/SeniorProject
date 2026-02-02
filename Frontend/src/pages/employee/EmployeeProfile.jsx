import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Lock, Bell, Globe, Save, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts';
import { changeLanguage } from '../../i18n';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function EmployeeProfile() {
  const { t, i18n } = useTranslation();
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await updateProfile(profileData);
    setLoading(false);
    if (result.success) {
      toast.success('Profile updated successfully');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error(t('errors.passwordMismatch'));
      return;
    }
    setLoading(true);
    const result = await changePassword(passwordData.current_password, passwordData.new_password);
    setLoading(false);
    if (result.success) {
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    }
  };

  const tabs = [
    { id: 'personal', label: t('profile.personalInfo'), icon: User },
    { id: 'password', label: t('profile.changePassword'), icon: Lock },
    { id: 'preferences', label: t('profile.preferences'), icon: Globe },
  ];

  return (
    <div className="fade-in max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('profile.title')}</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Personal Info Tab */}
      {activeTab === 'personal' && (
        <form onSubmit={handleProfileUpdate} className="card space-y-6">
          <div className="flex items-center gap-6 pb-6 border-b border-gray-200">
            <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="h-10 w-10 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user?.first_name} {user?.last_name}
              </h3>
              <p className="text-gray-500">{user?.email}</p>
              <p className="text-sm text-primary-600 mt-1">{user?.role?.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">{t('auth.firstName')}</label>
              <input
                type="text"
                value={profileData.first_name}
                onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="label">{t('auth.lastName')}</label>
              <input
                type="text"
                value={profileData.last_name}
                onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">{t('auth.email')}</label>
            <input type="email" value={profileData.email} disabled className="input bg-gray-50" />
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
            {t('common.save')}
          </button>
        </form>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <form onSubmit={handlePasswordChange} className="card space-y-6">
          <div>
            <label className="label">{t('profile.currentPassword')}</label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.current_password}
                onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                className="input pr-10"
              />
              <button type="button" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">{t('profile.newPassword')}</label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="input pr-10"
              />
              <button type="button" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label">{t('auth.confirmPassword')}</label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="input pr-10"
              />
              <button type="button" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">
                {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Lock className="h-5 w-5 mr-2" />}
            {t('profile.changePassword')}
          </button>
        </form>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="card space-y-6">
          <div>
            <label className="label">{t('common.language')}</label>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => changeLanguage('en')}
                className={clsx(
                  'px-4 py-2 rounded-lg border-2 transition-colors',
                  i18n.language === 'en' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                )}
              >
                {t('common.english')}
              </button>
              <button
                onClick={() => changeLanguage('ar')}
                className={clsx(
                  'px-4 py-2 rounded-lg border-2 transition-colors',
                  i18n.language === 'ar' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                )}
              >
                {t('common.arabic')}
              </button>
            </div>
          </div>

          <div>
            <label className="label flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t('profile.notifications')}
            </label>
            <div className="space-y-3 mt-2">
              {['Email notifications', 'Quiz reminders', 'Training updates'].map((item) => (
                <label key={item} className="flex items-center gap-3">
                  <input type="checkbox" defaultChecked className="h-4 w-4 text-primary-600 rounded" />
                  <span className="text-gray-700">{item}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeProfile;
