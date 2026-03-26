import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import logo from '../pages/joblithic.png';
import './Auth.css';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

      const userRes = await api.get('/api/auth/me');
      const currentUser = userRes.data;

      if (currentUser.roleName !== 'ADMIN') {
        await api.post('/logout');
        setError('This portal is only for admin accounts.');
        return;
      }

      login(currentUser);
      navigate('/admin/dashboard', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Invalid admin username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-shell admin-auth-shell">
      <div className="auth-card login-card-modern admin-login-card">
        <div className="admin-login-badge">
          <Shield size={15} />
          <span>Secure Admin Portal</span>
        </div>

        <div className="auth-logo-wrap">
          <img src={logo} alt="JobLithic" />
        </div>

        <h1>Admin Sign In</h1>
        <p className="auth-subtitle">
          Review platform activity, manage users, moderate jobs, and handle application flow from one control room.
        </p>

        <div className="admin-login-highlights">
          <div>
            <strong>Separate access</strong>
            <span>Admin users are blocked from the normal login screen.</span>
          </div>
          <div>
            <strong>Backend protected</strong>
            <span>Every admin API is secured with the `ADMIN` role on Spring Security.</span>
          </div>
        </div>

        {error && <div className="auth-banner error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="username">Admin Username</label>
          <div className="auth-input">
            <User size={16} />
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
              placeholder="Enter admin username"
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

          <button type="submit" className="auth-submit admin-submit" disabled={loading}>
            {loading ? 'Verifying access...' : 'Enter Admin Panel'}
          </button>
        </form>

        <p className="auth-switch">
          User account? <Link to="/login">Go to normal login</Link>
        </p>
      </div>
    </section>
  );
};

export default AdminLogin;
