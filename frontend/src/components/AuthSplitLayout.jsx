import PropTypes from 'prop-types';
import './AuthSplitLayout.css';

const AuthSplitLayout = ({
  brand = 'CareerLink',
  showcaseTitle,
  showcaseDescription,
  showcaseFooter,
  showcaseImageSrc,
  showcaseImageAlt = 'Auth illustration',
  showcasePlaceholderTitle = 'PNG illustration space',
  showcasePlaceholderText = 'Drop a transparent PNG here whenever you are ready.',
  title,
  subtitle,
  helperText,
  helperLink,
  children
}) => (
  <section className="auth-shell auth-shell-reference">
    <div className="auth-reference-frame">
      <aside className="auth-reference-showcase">
        <div className="auth-reference-brand">{brand}</div>

        <div className="auth-reference-copy">
          <h2>{showcaseTitle}</h2>
          <p>{showcaseDescription}</p>
        </div>

        <div className={`auth-reference-illustration${showcaseImageSrc ? ' has-image' : ''}`.trim()}>
          {showcaseImageSrc ? (
            <img src={showcaseImageSrc} alt={showcaseImageAlt} />
          ) : (
            <div className="auth-reference-placeholder">
              <span>{showcasePlaceholderTitle}</span>
              <small>{showcasePlaceholderText}</small>
            </div>
          )}
        </div>

        <div className="auth-reference-footer">{showcaseFooter}</div>
      </aside>

      <div className="auth-reference-form-panel">
        <div className="auth-reference-form-inner">
          <h1>{title}</h1>
          <p className="auth-reference-subtitle">{subtitle}</p>
          {helperText && helperLink ? (
            <p className="auth-reference-helper">
              <span>{helperText} </span>
              {helperLink}
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  </section>
);

AuthSplitLayout.propTypes = {
  brand: PropTypes.string,
  children: PropTypes.node.isRequired,
  helperLink: PropTypes.node,
  helperText: PropTypes.string,
  showcaseDescription: PropTypes.string.isRequired,
  showcaseFooter: PropTypes.string,
  showcaseImageAlt: PropTypes.string,
  showcaseImageSrc: PropTypes.string,
  showcasePlaceholderText: PropTypes.string,
  showcasePlaceholderTitle: PropTypes.string,
  showcaseTitle: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired
};

export default AuthSplitLayout;
