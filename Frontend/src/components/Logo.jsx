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
