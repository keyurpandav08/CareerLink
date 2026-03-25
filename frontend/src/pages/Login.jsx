import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathByRole } from '../utils/role';
import api from '../services/api';
import logo from '../pages/joblithic.png';
import './Auth.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const successMessage = location.state?.message || '';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const params = new URLSearchParams();
      params.append('username', formData.username.trim());
      params.append('password', formData.password);

      await api.post('/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const userRes = await api.get(`/users/username/${formData.username.trim()}`);
      const currentUser = userRes.data;

      login({
        id: currentUser.id,
        username: currentUser.username,
        fullName: currentUser.fullName,
        email: currentUser.email,
        roleName: currentUser.roleName
      });

      navigate(getDashboardPathByRole(currentUser.roleName), { replace: true });
    } catch (requestError) {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell">
      <div className="auth-card login-card-modern">
        <div className="auth-logo-wrap">
          <img src={logo} alt="JobLithic" />
        </div>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue your hiring or job search flow.</p>

        {successMessage && <div className="auth-banner success">{successMessage}</div>}
        {error && <div className="auth-banner error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="username">Username</label>
          <div className="auth-input">
            <User size={16} />
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
              placeholder="Enter username"
              required
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="auth-input">
            <KeyRound size={16} />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Enter password"
              required
            />
            <button type="button" className="auth-icon-btn" onClick={() => setShowPassword((prev) => !prev)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          <div className="auth-row-right">
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/register">Create account</Link>
        </p>
      </div>
    </section>
  );
};

export default Login;
