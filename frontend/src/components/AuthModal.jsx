import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Eye,
  EyeOff,
  IdCard,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  User,
  UserRound,
  X
} from 'lucide-react';
import GoogleAuthButton from './GoogleAuthButton';
import SkillTagInput from './SkillTagInput';
import BrandLogo from './BrandLogo';
import { useAuth } from '../context/AuthContext';
import { useAuthModal } from '../context/AuthModalContext';
import { getDashboardPathByRole } from '../utils/role';
import api from '../services/api';
import '../pages/Auth.css';
import './AuthModal.css';

const initialRegisterData = {
  fullName: '',
  username: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  skills: '',
  experience: 'Fresher',
  companyName: '',
  role: { name: 'APPLICANT' }
};

const ROLE_MAP = {
  APPLICANT: { name: 'APPLICANT' },
  EMPLOYER: { name: 'EMPLOYER' }
};

const AuthModal = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const {
    authMessage,
    authMode,
    closeAuthModal,
    isAuthModalOpen,
    setAuthMessage,
    switchAuthMode
  } = useAuthModal();

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState(initialRegisterData);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');

  const selectedRole = registerData.role.name;
  const passwordsMatch = registerData.confirmPassword.length > 0
    ? registerData.password === registerData.confirmPassword
    : true;

  const passwordChecks = useMemo(() => ({
    minLength: registerData.password.length >= 8,
    upper: /[A-Z]/.test(registerData.password),
    number: /\d/.test(registerData.password)
  }), [registerData.password]);

  const passwordStrong = Object.values(passwordChecks).every(Boolean);

  useEffect(() => {
    if (!isAuthModalOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeAuthModal();
      }
    };

    document.body.classList.add('auth-modal-open');
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.classList.remove('auth-modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeAuthModal, isAuthModalOpen]);

  useEffect(() => {
    if (user && isAuthModalOpen) {
      closeAuthModal();
    }
  }, [closeAuthModal, isAuthModalOpen, user]);

  const resetRegisterState = () => {
    setRegisterData(initialRegisterData);
    setAcceptedTerms(false);
    setRegisterError('');
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
  };

  const handleLoginSubmit = async (event) => {
    event.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('username', loginData.username.trim());
      params.append('password', loginData.password);

      await api.post('/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const userRes = await api.get('/api/auth/me');
      const currentUser = userRes.data;

      if (currentUser.roleName === 'ADMIN') {
        await api.post('/logout');
        setLoginError('Admin accounts must sign in from the admin login page.');
        return;
      }

      login({
        id: currentUser.id,
        username: currentUser.username,
        fullName: currentUser.fullName,
        email: currentUser.email,
        roleName: currentUser.roleName
      });

      closeAuthModal();
      navigate(getDashboardPathByRole(currentUser.roleName), { replace: true });
    } catch {
      setLoginError('Invalid username or password.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterFieldChange = (name, value) => {
    setRegisterData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (roleName) => {
    setRegisterError('');
    setRegisterData((prev) => ({
      ...prev,
      role: { name: roleName },
      ...(roleName === 'EMPLOYER' ? { skills: '', experience: '' } : { experience: prev.experience || 'Fresher' })
    }));
  };

  const handleRegisterSubmit = async (event) => {
    event.preventDefault();
    setRegisterError('');

    if (!acceptedTerms) {
      setRegisterError('Accept Terms and Privacy Policy before registration.');
      return;
    }
    if (!passwordStrong) {
      setRegisterError('Password must be at least 8 chars with 1 uppercase and 1 number.');
      return;
    }
    if (!passwordsMatch) {
      setRegisterError('Password and confirm password do not match.');
      return;
    }
    if (selectedRole === 'APPLICANT' && !registerData.skills.trim()) {
      setRegisterError('Please add at least one skill.');
      return;
    }
    if (selectedRole === 'EMPLOYER' && !registerData.companyName.trim()) {
      setRegisterError('Company name is required for employer registration.');
      return;
    }

    setRegisterLoading(true);

    try {
      const payload = {
        username: registerData.username.trim(),
        email: registerData.email.trim(),
        password: registerData.password,
        fullName: registerData.fullName.trim(),
        phone: registerData.phone.trim(),
        role: ROLE_MAP[selectedRole]
      };

      if (selectedRole === 'APPLICANT') {
        payload.skills = registerData.skills;
        payload.experience = registerData.experience;
      } else {
        payload.companyName = registerData.companyName.trim();
      }

      await api.post('/users/register', payload);
      resetRegisterState();
      setAuthMessage('');
      switchAuthMode('login', { message: 'Registration successful. Please sign in.' });
    } catch (requestError) {
      const serverData = requestError.response?.data;
      if (typeof serverData === 'string') {
        setRegisterError(serverData);
      } else if (serverData?.error) {
        setRegisterError(serverData.error);
      } else if (serverData && typeof serverData === 'object') {
        const firstError = Object.values(serverData)[0];
        setRegisterError(firstError || 'Registration failed.');
      } else {
        setRegisterError('Registration failed. Please try again.');
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  if (!isAuthModalOpen) {
    return null;
  }

  return (
    <div className="auth-modal-backdrop" onClick={closeAuthModal} role="presentation">
      <div className="auth-modal-card" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="auth-modal-close" onClick={closeAuthModal} aria-label="Close authentication popup">
          <X size={18} />
        </button>

        <div className="auth-modal-showcase">
          <BrandLogo variant="full" className="auth-modal-brand-logo" alt="CareerLink" />
          <h2>Find work with a cleaner, calmer hiring experience.</h2>
          <p>
            Search opportunities, build your profile once, and move between applications without jumping between pages.
          </p>

          <div className="auth-modal-orb auth-modal-orb-one" />
          <div className="auth-modal-orb auth-modal-orb-two" />

        
        </div>

        <div className="auth-modal-panel">
          <div className="auth-modal-panel-top">
            <div>
              <span className="auth-modal-overline">{authMode === 'login' ? 'Welcome back' : 'Create account'}</span>
              <h3>{authMode === 'login' ? 'Sign in to continue.' : 'Join CareerLink today.'}</h3>
            </div>

            <div className="auth-modal-switch">
              <button
                type="button"
                className={authMode === 'login' ? 'active' : ''}
                onClick={() => {
                  setLoginError('');
                  setAuthMessage('');
                  switchAuthMode('login');
                }}
              >
                Log in
              </button>
              <button
                type="button"
                className={authMode === 'register' ? 'active' : ''}
                onClick={() => {
                  setRegisterError('');
                  setAuthMessage('');
                  switchAuthMode('register');
                }}
              >
                Sign up
              </button>
            </div>
          </div>

          {authMode === 'login' ? (
            <div className="auth-modal-form-shell">
              {authMessage && <div className="auth-banner success">{authMessage}</div>}
              {loginError && <div className="auth-banner error">{loginError}</div>}

              <GoogleAuthButton label="Sign in with Google" onError={setLoginError} fullWidth />
              <div className="auth-divider auth-divider-tight"><span>or sign in with username</span></div>

              <form onSubmit={handleLoginSubmit} className="auth-form auth-form-compact">
                <label htmlFor="modal-username">Username</label>
                <div className="auth-input auth-input-soft">
                  <User size={16} />
                  <input
                    id="modal-username"
                    type="text"
                    value={loginData.username}
                    onChange={(event) => setLoginData((prev) => ({ ...prev, username: event.target.value }))}
                    placeholder="Enter username"
                    required
                  />
                </div>

                <label htmlFor="modal-password">Password</label>
                <div className="auth-input auth-input-soft">
                  <KeyRound size={16} />
                  <input
                    id="modal-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(event) => setLoginData((prev) => ({ ...prev, password: event.target.value }))}
                    placeholder="Enter password"
                    required
                  />
                  <button type="button" className="auth-icon-btn" onClick={() => setShowLoginPassword((prev) => !prev)}>
                    {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="auth-row-between">
                  <p className="auth-inline-note">Admin user?</p>
                  <Link to="/admin/login" onClick={closeAuthModal}>Use admin login</Link>
                </div>

                <div className="auth-row-right">
                  <Link to="/forgot-password" onClick={closeAuthModal}>Forgot Password?</Link>
                </div>

                <button type="submit" className="auth-submit auth-submit-soft" disabled={loginLoading}>
                  {loginLoading ? 'Signing in...' : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="auth-modal-form-shell auth-modal-form-shell-register">
              <div className="role-toggle role-toggle-soft">
                <button
                  type="button"
                  className={selectedRole === 'APPLICANT' ? 'active' : ''}
                  onClick={() => handleRoleChange('APPLICANT')}
                >
                  Candidate
                </button>
                <button
                  type="button"
                  className={selectedRole === 'EMPLOYER' ? 'active' : ''}
                  onClick={() => handleRoleChange('EMPLOYER')}
                >
                  Employer
                </button>
              </div>

              {registerError && <div className="auth-banner error">{registerError}</div>}

              <GoogleAuthButton label="Create account with Google" onError={setRegisterError} fullWidth />
              <div className="auth-divider auth-divider-tight"><span>or use email</span></div>

              <form onSubmit={handleRegisterSubmit} className="auth-form register-grid auth-form-compact">
                <div>
                  <label htmlFor="modal-fullName">{selectedRole === 'EMPLOYER' ? 'Contact Person' : 'Full Name'}</label>
                  <div className="auth-input auth-input-soft">
                    <IdCard size={16} />
                    <input
                      id="modal-fullName"
                      value={registerData.fullName}
                      onChange={(event) => handleRegisterFieldChange('fullName', event.target.value)}
                      required
                      placeholder={selectedRole === 'EMPLOYER' ? 'HR / hiring manager name' : 'Your full name'}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="modal-register-username">Username</label>
                  <div className="auth-input auth-input-soft">
                    <ShieldCheck size={16} />
                    <input
                      id="modal-register-username"
                      value={registerData.username}
                      onChange={(event) => handleRegisterFieldChange('username', event.target.value)}
                      required
                      minLength={3}
                      placeholder="Unique username"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="modal-phone">Phone</label>
                  <div className="auth-input auth-input-soft">
                    <Phone size={16} />
                    <input
                      id="modal-phone"
                      value={registerData.phone}
                      onChange={(event) => handleRegisterFieldChange('phone', event.target.value)}
                      required
                      placeholder="+91 98xxxxxx10"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="modal-email">Email</label>
                  <div className="auth-input auth-input-soft">
                    <Mail size={16} />
                    <input
                      id="modal-email"
                      type="email"
                      value={registerData.email}
                      onChange={(event) => handleRegisterFieldChange('email', event.target.value)}
                      required
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {selectedRole === 'APPLICANT' && (
                  <>
                    <div className="full-width">
                      <label htmlFor="modal-skills">Key Skills</label>
                      <SkillTagInput
                        value={registerData.skills}
                        onChange={(nextValue) => handleRegisterFieldChange('skills', nextValue)}
                        placeholder="Select or type skills"
                      />
                    </div>

                    <div className="full-width">
                      <label htmlFor="modal-experience">Experience Level</label>
                      <div className="auth-input auth-input-soft">
                        <UserRound size={16} />
                        <select
                          id="modal-experience"
                          value={registerData.experience}
                          onChange={(event) => handleRegisterFieldChange('experience', event.target.value)}
                          required
                        >
                          <option value="Fresher">Fresher (0-1 years)</option>
                          <option value="1-3 years">1-3 years</option>
                          <option value="3-5 years">3-5 years</option>
                          <option value="5-8 years">5-8 years</option>
                          <option value="8+ years">8+ years</option>
                        </select>
                      </div>
                    </div>
                  </>
                )}

                {selectedRole === 'EMPLOYER' && (
                  <div className="full-width">
                    <label htmlFor="modal-companyName">Company Name</label>
                    <div className="auth-input auth-input-soft">
                      <IdCard size={16} />
                      <input
                        id="modal-companyName"
                        value={registerData.companyName}
                        onChange={(event) => handleRegisterFieldChange('companyName', event.target.value)}
                        required
                        placeholder="e.g. DevSphere Pvt Ltd"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="modal-register-password">Password</label>
                  <div className="auth-input auth-input-soft">
                    <KeyRound size={16} />
                    <input
                      id="modal-register-password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerData.password}
                      onChange={(event) => handleRegisterFieldChange('password', event.target.value)}
                      required
                      placeholder="At least 8 chars"
                    />
                    <button type="button" className="auth-icon-btn" onClick={() => setShowRegisterPassword((prev) => !prev)}>
                      {showRegisterPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="modal-confirmPassword">Confirm Password</label>
                  <div className={`auth-input auth-input-soft ${!passwordsMatch ? 'input-error' : ''}`.trim()}>
                    <KeyRound size={16} />
                    <input
                      id="modal-confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={registerData.confirmPassword}
                      onChange={(event) => handleRegisterFieldChange('confirmPassword', event.target.value)}
                      required
                      placeholder="Re-enter password"
                    />
                    <button type="button" className="auth-icon-btn" onClick={() => setShowConfirmPassword((prev) => !prev)}>
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="full-width password-rules">
                  <span className={passwordChecks.minLength ? 'ok' : ''}>8+ characters</span>
                  <span className={passwordChecks.upper ? 'ok' : ''}>1 uppercase letter</span>
                  <span className={passwordChecks.number ? 'ok' : ''}>1 number</span>
                </div>

                <label className="terms-check full-width terms-check-soft">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(event) => setAcceptedTerms(event.target.checked)}
                  />
                  <span>
                    I agree to <Link to="/terms" onClick={closeAuthModal}>Terms</Link> and{' '}
                    <Link to="/privacy-policy" onClick={closeAuthModal}>Privacy Policy</Link>.
                  </span>
                </label>

                <button type="submit" className="auth-submit auth-submit-soft full-width" disabled={registerLoading}>
                  {registerLoading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
