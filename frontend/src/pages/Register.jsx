import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, IdCard, KeyRound, Mail, Phone, ShieldCheck, UserRound } from 'lucide-react';
import SkillTagInput from '../components/SkillTagInput';
import GoogleAuthButton from '../components/GoogleAuthButton';
import api from '../services/api';
import logo from '../pages/joblithic.png';
import './Auth.css';

const initialData = {
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

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialData);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const selectedRole = formData.role.name;
  const passwordsMatch = formData.confirmPassword.length > 0
    ? formData.password === formData.confirmPassword
    : true;

  const passwordChecks = useMemo(() => ({
    minLength: formData.password.length >= 8,
    upper: /[A-Z]/.test(formData.password),
    number: /\d/.test(formData.password)
  }), [formData.password]);

  const passwordStrong = Object.values(passwordChecks).every(Boolean);

  const handleFieldChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (roleName) => {
    setError('');
    setFormData((prev) => ({
      ...prev,
      role: { name: roleName },
      ...(roleName === 'EMPLOYER' ? { skills: '', experience: '' } : { experience: prev.experience || 'Fresher' })
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!acceptedTerms) {
      setError('Accept Terms and Privacy Policy before registration.');
      return;
    }
    if (!passwordStrong) {
      setError('Password must be at least 8 chars with 1 uppercase and 1 number.');
      return;
    }
    if (!passwordsMatch) {
      setError('Password and confirm password do not match.');
      return;
    }
    if (selectedRole === 'APPLICANT' && !formData.skills.trim()) {
      setError('Please add at least one skill.');
      return;
    }
    if (selectedRole === 'EMPLOYER' && !formData.companyName.trim()) {
      setError('Company name is required for employer registration.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        role: ROLE_MAP[selectedRole]
      };

      if (selectedRole === 'APPLICANT') {
        payload.skills = formData.skills;
        payload.experience = formData.experience;
      } else {
        payload.companyName = formData.companyName.trim();
      }

      await api.post('/users/register', payload);
      navigate('/login', { state: { message: 'Registration successful. Please sign in.' } });
    } catch (requestError) {
      const serverData = requestError.response?.data;
      if (typeof serverData === 'string') {
        setError(serverData);
      } else if (serverData?.error) {
        setError(serverData.error);
      } else if (serverData && typeof serverData === 'object') {
        const firstError = Object.values(serverData)[0];
        setError(firstError || 'Registration failed.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell register-shell">
      <div className="auth-card register-card-modern">
        <div className="auth-logo-wrap">
          <img src={logo} alt="JobLithic" />
        </div>
        <h1>Create your account</h1>
        <p className="auth-subtitle">Use complete profile info to get accurate matches and faster responses.</p>

        <div className="role-toggle">
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

        {error && <div className="auth-banner error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form register-grid">
          <div>
            <label htmlFor="fullName">{selectedRole === 'EMPLOYER' ? 'Contact Person' : 'Full Name'}</label>
            <div className="auth-input">
              <IdCard size={16} />
              <input
                id="fullName"
                value={formData.fullName}
                onChange={(event) => handleFieldChange('fullName', event.target.value)}
                required
                placeholder={selectedRole === 'EMPLOYER' ? 'HR / hiring manager name' : 'Your full name'}
              />
            </div>
          </div>

          <div>
            <label htmlFor="username">Username</label>
            <div className="auth-input">
              <ShieldCheck size={16} />
              <input
                id="username"
                value={formData.username}
                onChange={(event) => handleFieldChange('username', event.target.value)}
                required
                minLength={3}
                placeholder="Unique username"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email">Email</label>
            <div className="auth-input">
              <Mail size={16} />
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(event) => handleFieldChange('email', event.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone">Phone</label>
            <div className="auth-input">
              <Phone size={16} />
              <input
                id="phone"
                value={formData.phone}
                onChange={(event) => handleFieldChange('phone', event.target.value)}
                required
                placeholder="+91 98xxxxxx10"
              />
            </div>
          </div>

          {selectedRole === 'APPLICANT' && (
            <>
              <div className="full-width">
                <label htmlFor="skills">Key Skills</label>
                <SkillTagInput
                  value={formData.skills}
                  onChange={(nextValue) => handleFieldChange('skills', nextValue)}
                  placeholder="Select or type skills"
                />
              </div>

              <div className="full-width">
                <label htmlFor="experience">Experience Level</label>
                <div className="auth-input">
                  <UserRound size={16} />
                  <select
                    id="experience"
                    value={formData.experience}
                    onChange={(event) => handleFieldChange('experience', event.target.value)}
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
            <>
              <div className="full-width">
                <label htmlFor="companyName">Company Name</label>
                <div className="auth-input">
                  <IdCard size={16} />
                  <input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(event) => handleFieldChange('companyName', event.target.value)}
                    required
                    placeholder="e.g. DevSphere Pvt Ltd"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="password">Password</label>
            <div className="auth-input">
              <KeyRound size={16} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(event) => handleFieldChange('password', event.target.value)}
                required
                placeholder="At least 8 chars"
              />
              <button type="button" className="auth-icon-btn" onClick={() => setShowPassword((prev) => !prev)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className={`auth-input ${!passwordsMatch ? 'input-error' : ''}`}>
              <KeyRound size={16} />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(event) => handleFieldChange('confirmPassword', event.target.value)}
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

          <label className="terms-check full-width">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
            />
            <span>
              I agree to <Link to="/terms">Terms</Link> and <Link to="/privacy-policy">Privacy Policy</Link>.
            </span>
          </label>

          <button type="submit" className="auth-submit full-width" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
        <div className="auth-divider"><span>or</span></div>
        <GoogleAuthButton label="Create account with Google" onError={setError} />
      </div>
    </section>
  );
};

export default Register;
