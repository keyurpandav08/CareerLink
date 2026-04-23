import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathByRole } from '../utils/role';
import api from '../services/api';
import { getPublicConfig } from '../services/publicConfig';

const GOOGLE_SCRIPT_ID = 'google-identity-services';
const isLikelyGoogleClientId = (value) => typeof value === 'string' && value.includes('.apps.googleusercontent.com');

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(normalized));
  } catch {
    return {};
  }
};

const GoogleAuthButton = ({ label = 'Continue with Google', onError, fullWidth = false }) => {
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [clientId, setClientId] = useState('');
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        const config = await getPublicConfig();
        if (!cancelled) {
          setClientId(config.googleClientId || '');
          setConfigError('');
        }
      } catch {
        if (!cancelled) {
          setConfigError('Google sign-in configuration could not be loaded from the backend.');
        }
      } finally {
        if (!cancelled) {
          setConfigLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  const invalidClientId = clientId && !isLikelyGoogleClientId(clientId);

  useEffect(() => {
    if (!clientId || invalidClientId || !buttonRef.current) return;

    const initializeGoogleButton = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            setLoading(true);
            const payload = decodeJwtPayload(response.credential);
            const result = await api.post('/api/auth/google', {
              credential: response.credential,
              fullName: payload.name || payload.email || 'Google User'
            });

            const currentUser = result.data.user;
            login(currentUser);
            navigate(getDashboardPathByRole(currentUser.roleName), { replace: true });
          } catch {
            onError?.('Google sign-in failed. Check Google client ID and backend connection.');
          } finally {
            setLoading(false);
          }
        }
      });

      buttonRef.current.innerHTML = '';
      const measuredWidth = Math.round(buttonRef.current.getBoundingClientRect().width || 320);
      const buttonWidth = fullWidth
        ? Math.min(Math.max(measuredWidth, 280), 440)
        : 320;

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: buttonWidth,
        text: label.includes('Create') ? 'signup_with' : 'continue_with',
        shape: 'pill'
      });
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID);
    if (existingScript) {
      initializeGoogleButton();
      return;
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleButton;
    document.body.appendChild(script);
  }, [clientId, fullWidth, invalidClientId, label, login, navigate, onError]);

  if (configLoading || !clientId || invalidClientId) {
    return (
      <button
        type="button"
        className={`google-auth-fallback ${fullWidth ? 'google-auth-fallback-full' : ''}`.trim()}
        onClick={() => onError?.(
          invalidClientId
            ? 'Google sign-in is misconfigured. Use the Web Client ID that ends with .apps.googleusercontent.com, not the GOCSPX client secret.'
            : configLoading
              ? 'Loading Google sign-in configuration...'
              : configError || 'Set app.oauth.google.client-id in src/main/resources/application.properties to enable Google sign-in.'
        )}
        disabled={configLoading}
      >
        <Chrome size={18} />
        {configLoading ? 'Loading Google...' : label}
      </button>
    );
  }

  return (
    <div className={`google-auth-wrap ${fullWidth ? 'google-auth-wrap-full' : ''}`.trim()}>
      <div ref={buttonRef} className={loading ? 'google-auth-disabled' : ''} />
    </div>
  );
};

GoogleAuthButton.propTypes = {
  fullWidth: PropTypes.bool,
  label: PropTypes.string,
  onError: PropTypes.func
};

export default GoogleAuthButton;
