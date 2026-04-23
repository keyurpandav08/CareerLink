import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { KeyRound, Mail, RotateCcw, ShieldCheck } from 'lucide-react';
import api from '../services/api';

const initialState = {
  step: 1,
  email: '',
  otp: '',
  newPassword: '',
  confirmPassword: ''
};

const ForgotPasswordPanel = ({ onBackToLogin, onResetSuccess }) => {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [timer]);

  const updateField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const sendOtp = async () => {
    const email = form.email.trim();
    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await api.post('/api/auth/forgot-password', { email });
      setForm((prev) => ({ ...prev, step: 2 }));
      setSuccess(response.data?.message || 'OTP sent to your email');
      setTimer(30);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const email = form.email.trim();
    const otp = form.otp.trim();
    if (!otp) {
      setError('OTP is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await api.post('/api/auth/verify-otp', { email, otp });
      setForm((prev) => ({ ...prev, step: 3 }));
      setSuccess('OTP verified successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    const email = form.email.trim();
    const { newPassword, confirmPassword } = form;

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await api.post('/api/auth/reset-password', {
        email,
        newPassword
      });

      setForm({ ...initialState });
      onResetSuccess('Password reset successful. Please sign in.');
    } catch (err) {
      setError(err.response?.data?.error || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-modal-shell">
      <div className="forgot-modal-intro">
        <span className="auth-modal-overline">Reset access</span>
        <h3>Recover your account securely.</h3>
        <p className="auth-modal-copy">
          We'll send a one-time code to your registered email, then let you set a new password.
        </p>
      </div>

      <div className="forgot-step-track" aria-label="Password reset progress">
        <span className={`forgot-step-pill ${form.step >= 1 ? 'active' : ''}`}>
          <Mail size={14} />
          Email
        </span>
        <span className={`forgot-step-pill ${form.step >= 2 ? 'active' : ''}`}>
          <ShieldCheck size={14} />
          Verify
        </span>
        <span className={`forgot-step-pill ${form.step >= 3 ? 'active' : ''}`}>
          <KeyRound size={14} />
          New password
        </span>
      </div>

      {error && <div className="auth-banner error">{error}</div>}
      {success && <div className="auth-banner success">{success}</div>}

      <div className="forgot-step-card">
        {form.step === 1 && (
          <>
            <label htmlFor="forgot-email">Registered email</label>
            <div className="auth-input auth-input-soft">
              <Mail size={16} />
              <input
                id="forgot-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="forgot-step-actions">
              <button type="button" className="auth-submit auth-submit-soft" onClick={sendOtp} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          </>
        )}

        {form.step === 2 && (
          <>
            <label htmlFor="forgot-otp">Verification code</label>
            <div className="auth-input auth-input-soft">
              <ShieldCheck size={16} />
              <input
                id="forgot-otp"
                type="text"
                value={form.otp}
                onChange={(event) => updateField('otp', event.target.value)}
                placeholder="Enter OTP"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </div>

            <div className="forgot-help-row">
              <p className="forgot-modal-note">
                Check your inbox and spam folder for the OTP email.
              </p>
              <button
                type="button"
                className="auth-inline-link"
                onClick={timer > 0 ? undefined : sendOtp}
                disabled={timer > 0 || loading}
              >
                {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
              </button>
            </div>

            <div className="forgot-step-actions">
              <button type="button" className="auth-submit auth-submit-soft" onClick={verifyOtp} disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
          </>
        )}

        {form.step === 3 && (
          <>
            <label htmlFor="forgot-password">New password</label>
            <div className="auth-input auth-input-soft">
              <KeyRound size={16} />
              <input
                id="forgot-password"
                type="password"
                value={form.newPassword}
                onChange={(event) => updateField('newPassword', event.target.value)}
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />
            </div>

            <label htmlFor="forgot-confirm-password">Confirm password</label>
            <div className="auth-input auth-input-soft">
              <KeyRound size={16} />
              <input
                id="forgot-confirm-password"
                type="password"
                value={form.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                placeholder="Re-enter your new password"
                autoComplete="new-password"
              />
            </div>

            <div className="forgot-step-actions">
              <button type="button" className="auth-submit auth-submit-soft" onClick={resetPassword} disabled={loading}>
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="forgot-modal-footer">
        <button type="button" className="auth-inline-link" onClick={onBackToLogin}>
          <RotateCcw size={14} />
          Back to sign in
        </button>
      </div>
    </div>
  );
};

ForgotPasswordPanel.propTypes = {
  onBackToLogin: PropTypes.func.isRequired,
  onResetSuccess: PropTypes.func.isRequired
};

export default ForgotPasswordPanel;
