import PropTypes from 'prop-types';

const LOGO_SOURCES = {
  full: '/MainLogo.png',
  icon: '/HeaderIcon.png'
};

const BrandLogo = ({ variant = 'full', className = '', alt = 'CareerLink', ...imgProps }) => {
  const src = LOGO_SOURCES[variant] || LOGO_SOURCES.full;
  const classes = ['brand-logo', `brand-logo--${variant}`, className].filter(Boolean).join(' ');

  return <img src={src} alt={alt} className={classes} {...imgProps} />;
};

BrandLogo.propTypes = {
  alt: PropTypes.string,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['full', 'icon'])
};

export default BrandLogo;
