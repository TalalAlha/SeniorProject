/**
 * PasswordRequirements — Live password strength checklist.
 *
 * Renders a list of password rules (length, uppercase, number, special char)
 * and highlights each one green as the user's password satisfies it.
 * Used in RegisterPage and ResetPassword.
 */
import { CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';
import { passwordChecks } from '../utils/passwordValidation';

const Row = ({ ok, label }) => (
  <li className={clsx('flex items-center gap-2', ok && 'text-success-600')}>
    {ok ? (
      <CheckCircle className="h-4 w-4" />
    ) : (
      <span className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600" />
    )}
    {label}
  </li>
);

const PasswordRequirements = ({ password = '', className = '' }) => {
  const { t } = useTranslation();
  const checks = passwordChecks(password);

  return (
    <div
      className={clsx(
        'p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300',
        className
      )}
    >
      <p className="font-medium mb-2">{t('profile.passwordRequirements')}</p>
      <ul className="space-y-1">
        <Row ok={checks.length} label={t('profile.atLeast8Chars')} />
        <Row ok={checks.upperLower} label={t('profile.upperAndLower')} />
        <Row ok={checks.number} label={t('profile.atLeastOneNumber')} />
        <Row ok={checks.special} label={t('profile.atLeastOneSpecial')} />
      </ul>
    </div>
  );
};

export default PasswordRequirements;
