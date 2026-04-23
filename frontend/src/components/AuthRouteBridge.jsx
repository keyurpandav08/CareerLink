import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthModal } from '../context/AuthModalContext';

const resolveFallbackPath = (state) => {
  if (typeof state?.backgroundPath === 'string' && state.backgroundPath.trim()) {
    return state.backgroundPath;
  }

  const backgroundLocation = state?.backgroundLocation;
  if (backgroundLocation?.pathname) {
    return `${backgroundLocation.pathname}${backgroundLocation.search || ''}${backgroundLocation.hash || ''}`;
  }

  return '/';
};

const AuthRouteBridge = ({ mode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openAuthModal } = useAuthModal();

  useEffect(() => {
    openAuthModal(mode, { message: location.state?.message || '' });
    navigate(resolveFallbackPath(location.state), { replace: true });
  }, [location.state, mode, navigate, openAuthModal]);

  return null;
};

AuthRouteBridge.propTypes = {
  mode: PropTypes.oneOf(['login', 'register', 'forgot']).isRequired
};

export default AuthRouteBridge;
