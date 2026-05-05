import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function HelpTooltip({ i18nKey }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative inline-flex items-center flex-shrink-0">
      <button
        type="button"
        className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-xs font-bold flex items-center justify-center hover:bg-primary-100 dark:hover:bg-primary-900/40 hover:text-primary-600 dark:hover:text-primary-400 transition-colors cursor-help"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        aria-label={t(i18nKey)}
        tabIndex={0}
      >
        ?
      </button>

      {visible && (
        <div className="absolute top-full start-0 mt-2 z-50 w-72 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-sm px-3 py-2.5 shadow-xl pointer-events-none leading-relaxed">
          <div className="absolute bottom-full start-3 border-4 border-transparent border-b-gray-900 dark:border-b-gray-700" />
          {t(i18nKey)}
        </div>
      )}
    </div>
  );
}
