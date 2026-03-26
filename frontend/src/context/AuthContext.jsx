import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import api from '../services/api';
import './AuthContext.css';

const AuthContext = createContext(null);
const AUTH_BOOTSTRAP_TIMEOUT_MS = 4000;

const normalizeUser = (userData) => {
  if (!userData) return null;

  return {
    ...userData,
    roleName: userData.roleName || userData.role?.name || null
  };
};

const clearStoredUser = () => localStorage.removeItem('user');

const getStoredUser = () => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser || storedUser === 'undefined') {
    return null;
  }

  try {
    return normalizeUser(JSON.parse(storedUser));
  } catch (error) {
    console.error('Failed to parse user from localStorage', error);
    clearStoredUser();
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const hydrateUser = async () => {
      const storedUser = getStoredUser();

      try {
        const response = await api.get('/api/auth/me', {
          timeout: AUTH_BOOTSTRAP_TIMEOUT_MS
        });
        if (!mounted) return;

        const currentUser = normalizeUser(response.data);
        setUser(currentUser);
        localStorage.setItem('user', JSON.stringify(currentUser));
      } catch (error) {
        if (!mounted) return;

        const status = error.response?.status;
        if (status === 401 || status === 403) {
          setUser(null);
          clearStoredUser();
        } else {
          setUser(storedUser);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    hydrateUser();

    return () => {
      mounted = false;
    };
  }, []);

  const login = (userData) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    localStorage.setItem('user', JSON.stringify(normalized));
  };

  const logout = async () => {
    try {
      await api.post('/logout');
    } catch (error) {
      console.error('Logout failed', error);
    }

    setUser(null);
    clearStoredUser();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {loading ? (
        <div className="auth-bootstrap-screen">
          <div className="auth-bootstrap-card">
            <span className="auth-bootstrap-badge">JobLithic</span>
            <h1>Preparing your workspace</h1>
            <p>Checking your session and loading the right experience.</p>
            <div className="auth-bootstrap-bar" aria-hidden="true">
              <span />
            </div>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAuth = () => useContext(AuthContext);
