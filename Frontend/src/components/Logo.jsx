/**
 * Logo — PhishAware brand logo image.
 *
 * Renders the correct logo asset based on variant and colour scheme.
 *
 * @param {'icon'|'horizontal'|'vertical'} variant - Layout of the logo image
 * @param {boolean} white - Use the white/inverted version for dark backgrounds
 * @param {string} className - Additional Tailwind classes
 */
const Logo = ({
  variant = 'horizontal', // icon, horizontal, vertical
  white = false,          // use white version for dark backgrounds
  className = ''
}) => {
  const logoFiles = {
    icon: white ? '/logo/logo-white.png' : '/logo/logo-icon.png',
    horizontal: white ? '/logo/logo-white.png' : '/logo/logo-horizontal.png',
    vertical: white ? '/logo/logo-white.png' : '/logo/logo-vertical.png',
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
