import { useTheme } from '../contexts/ThemeContext';

/**
 * Logo — PhishAware brand logo image.
 *
 * Renders the correct logo asset based on variant and colour scheme.
 *
 * @param {'icon'|'horizontal'|'vertical'} variant - Layout of the logo image
 * @param {boolean} white - Force the white/inverted version (e.g. on coloured backgrounds)
 * @param {string} className - Additional Tailwind classes
 */
const Logo = ({
  variant = 'horizontal', // icon, horizontal, vertical
  white = false,          // force white version for coloured backgrounds
  className = ''
}) => {
  const { isDark } = useTheme();

  const logoFiles = {
    icon: white ? '/logo/logo-white.png' : '/logo/logo-icon.png',
    horizontal: white
      ? '/logo/logo-white.png'
      : isDark
        ? '/logo/logo-horizontal-dark.png'
        : '/logo/logo-horizontal.png',
    vertical: white
      ? '/logo/logo-white.png'
      : isDark
        ? '/logo/logo-vertical-dark.png'
        : '/logo/logo-vertical.png',
  };

  return (
    <img
      src={logoFiles[variant]}
      alt="PhishAware"
      className={className}
    />
  );
};

export default Logo;
