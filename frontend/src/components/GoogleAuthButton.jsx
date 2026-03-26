import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Chrome } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathByRole } from '../utils/role';
import api from '../services/api';

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

const GoogleAuthButton = ({ label = 'Continue with Google', onError }) => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const invalidClientId = clientId && !isLikelyGoogleClientId(clientId);
  const buttonRef = useRef(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

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
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
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
  }, [clientId, invalidClientId, label, login, navigate, onError]);

  if (!clientId || invalidClientId) {
    return (
      <button
        type="button"
        className="google-auth-fallback"
        onClick={() => onError?.(
          invalidClientId
            ? 'Google sign-in is misconfigured. Use the Web Client ID that ends with .apps.googleusercontent.com, not the GOCSPX client secret.'
            : 'Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in.'
        )}
      >
        <Chrome size={18} />
        {label}
      </button>
    );
  }

  return (
    <div className="google-auth-wrap">
      <div ref={buttonRef} className={loading ? 'google-auth-disabled' : ''} />
    </div>
  );
};

GoogleAuthButton.propTypes = {
  label: PropTypes.string,
  onError: PropTypes.func
};

export default GoogleAuthButton;
