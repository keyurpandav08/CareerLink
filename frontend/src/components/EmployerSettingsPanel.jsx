import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Bell, Building2, Globe2, ImageUp, Shield, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import '../pages/Settings.css';

const SETTINGS_STORAGE_KEY = 'joblithic_employer_settings';

const defaultSettings = {
  emailNotifications: true,
  jobAlerts: true
};

const defaultProfile = {
  id: null,
  fullName: '',
  email: '',
  phone: '',
  companyName: '',
  companyLogoUrl: '',
  companyOverview: '',
  companyReviewSummary: '',
  companyReviewCount: 0
};

const resizeImageToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const maxSize = 220;
      const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
      const width = Math.round(image.width * scale);
      const height = Math.round(image.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('Canvas unavailable'));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.86));
    };
    image.onerror = () => reject(new Error('Invalid image file'));
    image.src = String(reader.result);
  };
  reader.onerror = () => reject(new Error('Failed to read image'));
  reader.readAsDataURL(file);
});

const EmployerSettingsPanel = ({ open, profile, onClose, onSaved }) => {
  const { user, login } = useAuth();
  const [formProfile, setFormProfile] = useState(defaultProfile);
  const [settings, setSettings] = useState(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState('');
  const [error, setError] = useState('');
  const [logoInput, setLogoInput] = useState('');

  useEffect(() => {
    if (!open) return;

    try {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
      setSettings({ ...defaultSettings, ...stored });
    } catch {
      setSettings(defaultSettings);
    }

    const nextProfile = { ...defaultProfile, ...(profile || {}) };
    setFormProfile(nextProfile);
    setLogoInput(nextProfile.companyLogoUrl?.startsWith('data:image') ? '' : (nextProfile.companyLogoUrl || ''));
    setBanner('');
    setError('');
  }, [open, profile]);

  const companyCompletion = useMemo(() => {
    const checkpoints = [
      formProfile.companyName,
      formProfile.companyLogoUrl,
      formProfile.companyOverview,
      formProfile.companyReviewSummary,
      formProfile.phone
    ];
    const filled = checkpoints.filter((item) => String(item || '').trim()).length;
    return Math.round((filled / checkpoints.length) * 100);
  }, [formProfile]);

  const setField = (name, value) => {
    setFormProfile((prev) => ({ ...prev, [name]: value }));
  };

  const setSetting = (name, value) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const resizedDataUrl = await resizeImageToDataUrl(file);
      setField('companyLogoUrl', resizedDataUrl);
      setLogoInput('');
      setBanner('Logo uploaded and optimized successfully.');
      setTimeout(() => setBanner(''), 1800);
    } catch {
      setError('Failed to process logo image. Try a smaller PNG or JPG file.');
    }
  };

  const saveProfile = async () => {
    if (!formProfile.id) return;

    setSaving(true);
    setError('');
    try {
      const payload = {
        fullName: formProfile.fullName,
        email: formProfile.email,
        phone: formProfile.phone,
        companyName: formProfile.companyName,
        companyLogoUrl: formProfile.companyLogoUrl,
        companyOverview: formProfile.companyOverview,
        companyReviewSummary: formProfile.companyReviewSummary,
        companyReviewCount: Number(formProfile.companyReviewCount) || 0
      };

      const response = await api.put(`/users/${formProfile.id}`, payload);
      const updatedProfile = response.data;

      setFormProfile((prev) => ({ ...prev, ...updatedProfile }));
      login({ ...user, ...updatedProfile, roleName: updatedProfile.roleName || user?.roleName });
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setBanner('Employer settings updated successfully.');
      onSaved?.(updatedProfile);
      setTimeout(() => setBanner(''), 1800);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to save employer settings.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="recruiter-settings-overlay" onClick={onClose}>
      <div className="recruiter-settings-modal settings-card-modern" onClick={(event) => event.stopPropagation()}>
        <header className="settings-header-modern">
          <div>
            <h1>Employer Profile Studio</h1>
            <p>Manage company branding, recruiter details, and communication preferences inside your recruiter workspace.</p>
          </div>

          <button type="button" className="recruiter-icon-btn" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </header>

        {banner && <div className="settings-banner">{banner}</div>}
        {error && <div className="settings-error">{error}</div>}

        <section className="settings-hero recruiter-settings-hero">
          <div>
            <span className="settings-kicker">Recruiter Workspace Settings</span>
            <h2>{formProfile.companyName || 'Complete your company profile'}</h2>
            <p>A polished employer profile makes your dashboard, jobs, and applications feel consistent with the new CareerLink UI.</p>
          </div>

          <div className="settings-completion">
            <strong>{companyCompletion}%</strong>
            <span>Profile strength</span>
          </div>
        </section>

        <section className="settings-section-modern">
          <h2><Building2 size={16} />Company Identity</h2>

          <div className="settings-grid">
            <div className="settings-field">
              <label htmlFor="companyName">Company Name</label>
              <input
                id="companyName"
                value={formProfile.companyName || ''}
                onChange={(event) => setField('companyName', event.target.value)}
                placeholder="Lumina Systems"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="fullName">Recruiter / Contact Person</label>
              <input
                id="fullName"
                value={formProfile.fullName || ''}
                onChange={(event) => setField('fullName', event.target.value)}
                placeholder="Hiring manager name"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="email">Work Email</label>
              <input
                id="email"
                type="email"
                value={formProfile.email || ''}
                onChange={(event) => setField('email', event.target.value)}
                placeholder="hiring@company.com"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                value={formProfile.phone || ''}
                onChange={(event) => setField('phone', event.target.value)}
                placeholder="+91 98xxxxxx10"
              />
            </div>

            <div className="settings-field full-span">
              <label htmlFor="companyLogoUrl">Company Logo</label>
              <div className="logo-upload-row">
                <input
                  id="companyLogoUrl"
                  value={logoInput}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    setLogoInput(nextValue);
                    setField('companyLogoUrl', nextValue);
                  }}
                  placeholder={formProfile.companyLogoUrl?.startsWith('data:image')
                    ? 'Logo uploaded from device. Paste URL only if you want to replace it.'
                    : 'Paste logo URL or upload a logo below'}
                />

                <label className="logo-upload-btn">
                  <ImageUp size={16} />
                  Upload logo
                  <input type="file" accept="image/*" onChange={uploadLogo} />
                </label>
              </div>

              {formProfile.companyLogoUrl && (
                <div className="logo-preview-card polished">
                  <div className="logo-preview-frame">
                    <img src={formProfile.companyLogoUrl} alt="Company logo preview" />
                  </div>
                  <div>
                    <strong>{formProfile.companyName || 'Company logo'}</strong>
                    <span>{formProfile.companyLogoUrl.startsWith('data:image') ? 'Uploaded from device' : 'External logo URL'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="settings-section-modern">
          <h2><Globe2 size={16} />Company Story</h2>

          <div className="settings-field full-span">
            <label htmlFor="companyOverview">About Company</label>
            <textarea
              id="companyOverview"
              value={formProfile.companyOverview || ''}
              onChange={(event) => setField('companyOverview', event.target.value)}
              placeholder="Describe your company, products, mission, and culture."
              rows={6}
            />
          </div>

          <div className="settings-grid">
            <div className="settings-field">
              <label htmlFor="companyReviewSummary">Review Headline</label>
              <input
                id="companyReviewSummary"
                value={formProfile.companyReviewSummary || ''}
                onChange={(event) => setField('companyReviewSummary', event.target.value)}
                placeholder="4.8 overall rating from employees"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="companyReviewCount">Review Count</label>
              <input
                id="companyReviewCount"
                type="number"
                min="0"
                value={formProfile.companyReviewCount ?? 0}
                onChange={(event) => setField('companyReviewCount', event.target.value)}
                placeholder="250"
              />
            </div>
          </div>
        </section>

        <section className="settings-section-modern">
          <h2><Bell size={16} />Recruiter Preferences</h2>

          <div className="switch-row">
            <div>
              <strong>Candidate alerts</strong>
              <span>Get notified when new applicants enter your pipeline.</span>
            </div>
            <label className="switch-btn">
              <input
                type="checkbox"
                checked={settings.jobAlerts}
                onChange={(event) => setSetting('jobAlerts', event.target.checked)}
              />
              <span />
            </label>
          </div>

          <div className="switch-row">
            <div>
              <strong>Email notifications</strong>
              <span>Receive important hiring updates and AI review summaries by email.</span>
            </div>
            <label className="switch-btn">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(event) => setSetting('emailNotifications', event.target.checked)}
              />
              <span />
            </label>
          </div>
        </section>

        <div className="recruiter-settings-actions">
          <button type="button" className="recruiter-secondary-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="settings-save-main" onClick={saveProfile} disabled={saving}>
            <Shield size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

EmployerSettingsPanel.propTypes = {
  open: PropTypes.bool.isRequired,
  profile: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func
};

EmployerSettingsPanel.defaultProps = {
  profile: null,
  onSaved: undefined
};

export default EmployerSettingsPanel;
