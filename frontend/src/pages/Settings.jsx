import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Building2, Globe2, ImageUp, Lock, Mail, Phone, Shield, Star, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForUser, getRoleName } from '../utils/role';
import api from '../services/api';
import './Settings.css';

const SETTINGS_STORAGE_KEY = 'joblithic_settings';

const defaultSettings = {
  profileVisibility: 'public',
  showEmail: true,
  showPhone: true,
  emailNotifications: true,
  jobAlerts: true
};

const defaultProfile = {
  id: null,
  fullName: '',
  email: '',
  phone: '',
  skills: '',
  experience: '',
  companyName: '',
  companyLogoUrl: '',
  companyOverview: '',
  companyReviewSummary: '',
  companyReviewCount: 250
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

const Settings = () => {
  const { user, login } = useAuth();
  const roleName = getRoleName(user);
  const isEmployer = roleName === 'EMPLOYER';

  const [profile, setProfile] = useState(defaultProfile);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState('');
  const [error, setError] = useState('');
  const [logoInput, setLogoInput] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
        setSettings({ ...defaultSettings, ...stored });
      } catch {
        setSettings(defaultSettings);
      }

      if (!user?.username) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/users/username/${user.username}`);
        const nextProfile = { ...defaultProfile, ...response.data };
        setProfile(nextProfile);
        setLogoInput(nextProfile.companyLogoUrl?.startsWith('data:image') ? '' : (nextProfile.companyLogoUrl || ''));
      } catch {
        setError('Failed to load profile settings.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.username]);

  const companyCompletion = useMemo(() => {
    const checkpoints = [
      profile.companyName,
      profile.companyLogoUrl,
      profile.companyOverview,
      profile.companyReviewSummary,
      profile.phone
    ];
    const filled = checkpoints.filter((item) => String(item || '').trim()).length;
    return Math.round((filled / checkpoints.length) * 100);
  }, [profile]);

  const setField = (name, value) => {
    setProfile((prev) => ({ ...prev, [name]: value }));
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
      setTimeout(() => setBanner(''), 1600);
    } catch {
      setError('Failed to process logo image. Try a smaller PNG or JPG file.');
    }
  };

  const saveProfile = async () => {
    if (!profile.id) return;

    setSaving(true);
    setError('');
    try {
      const payload = {
        fullName: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        skills: profile.skills,
        experience: profile.experience,
        companyName: profile.companyName,
        companyLogoUrl: profile.companyLogoUrl,
        companyOverview: profile.companyOverview,
        companyReviewSummary: profile.companyReviewSummary,
        companyReviewCount: Number(profile.companyReviewCount) || 0
      };

      const response = await api.put(`/users/${profile.id}`, payload);
      const updatedProfile = response.data;
      setProfile((prev) => ({ ...prev, ...updatedProfile }));
      login({ ...user, ...updatedProfile, roleName: updatedProfile.roleName || user?.roleName });

      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      setBanner(isEmployer ? 'Company profile updated successfully.' : 'Settings saved successfully.');
      setTimeout(() => setBanner(''), 1800);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to save profile settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <section className="settings-shell">Loading settings...</section>;
  }

  return (
    <section className="settings-shell">
      <div className={`container settings-card-modern ${isEmployer ? 'employer-settings-card' : ''}`}>
        <header className="settings-header-modern">
          <div>
            <h1>{isEmployer ? 'Employer Profile Studio' : 'Account Settings'}</h1>
            <p>
              {isEmployer
                ? 'Manage company branding, recruiter details, profile strength, and candidate communication settings.'
                : 'Manage visibility, notifications, and account preferences.'}
            </p>
          </div>
          <Link to={getDashboardPathForUser(user)}>Back to dashboard</Link>
        </header>

        {banner && <div className="settings-banner">{banner}</div>}
        {error && <div className="settings-error">{error}</div>}

        {isEmployer ? (
          <>
            <section className="settings-hero">
              <div>
                <span className="settings-kicker">Naukri-style company profile</span>
                <h2>{profile.companyName || 'Complete your company profile'}</h2>
                <p>
                  A strong employer profile increases trust and gives your job pages a more professional look.
                </p>
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
                    value={profile.companyName || ''}
                    onChange={(event) => setField('companyName', event.target.value)}
                    placeholder="DevSphere Pvt Ltd"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="fullName">Recruiter / Contact Person</label>
                  <input
                    id="fullName"
                    value={profile.fullName || ''}
                    onChange={(event) => setField('fullName', event.target.value)}
                    placeholder="Hiring manager name"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="email">Work Email</label>
                  <input
                    id="email"
                    type="email"
                    value={profile.email || ''}
                    onChange={(event) => setField('email', event.target.value)}
                    placeholder="hr@company.com"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="phone">Phone</label>
                  <input
                    id="phone"
                    value={profile.phone || ''}
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
                      placeholder={profile.companyLogoUrl?.startsWith('data:image')
                        ? 'Logo uploaded from device. Paste URL only if you want to replace it.'
                        : 'Paste logo URL or upload a logo below'}
                    />
                    <label className="logo-upload-btn">
                      <ImageUp size={16} />
                      Upload logo
                      <input type="file" accept="image/*" onChange={uploadLogo} />
                    </label>
                  </div>
                  {profile.companyLogoUrl && (
                    <div className="logo-preview-card polished">
                      <div className="logo-preview-frame">
                        <img src={profile.companyLogoUrl} alt="Company logo preview" />
                      </div>
                      <div>
                        <strong>{profile.companyName || 'Company logo'}</strong>
                        <span>{profile.companyLogoUrl.startsWith('data:image') ? 'Uploaded from device' : 'External logo URL'}</span>
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
                  value={profile.companyOverview || ''}
                  onChange={(event) => setField('companyOverview', event.target.value)}
                  placeholder="Describe your company, products, mission, and work culture."
                  rows={6}
                />
              </div>

              <div className="settings-grid">
                <div className="settings-field">
                  <label htmlFor="companyReviewSummary">Review Headline</label>
                  <input
                    id="companyReviewSummary"
                    value={profile.companyReviewSummary || ''}
                    onChange={(event) => setField('companyReviewSummary', event.target.value)}
                    placeholder="4.4 overall rating from employees"
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="companyReviewCount">Review Count</label>
                  <input
                    id="companyReviewCount"
                    type="number"
                    min="0"
                    value={profile.companyReviewCount ?? 0}
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
                  <span>Get notified when a new applicant enters your pipeline</span>
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
                  <span>Receive hiring updates and important actions on email</span>
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
          </>
        ) : (
          <>
            <section className="settings-section-modern">
              <h2><UserRound size={16} />Profile Visibility</h2>
              <div className="settings-row">
                <label htmlFor="profileVisibility">Who can view my profile?</label>
                <select
                  id="profileVisibility"
                  value={settings.profileVisibility}
                  onChange={(event) => setSetting('profileVisibility', event.target.value)}
                >
                  <option value="public">Public</option>
                  <option value="recruiters">Recruiters only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="switch-row">
                <div>
                  <strong>Show email</strong>
                  <span>Allow recruiters to contact via email</span>
                </div>
                <label className="switch-btn">
                  <input
                    type="checkbox"
                    checked={settings.showEmail}
                    onChange={(event) => setSetting('showEmail', event.target.checked)}
                  />
                  <span />
                </label>
              </div>
              <div className="switch-row">
                <div>
                  <strong>Show phone</strong>
                  <span>Allow direct phone contact for shortlisted roles</span>
                </div>
                <label className="switch-btn">
                  <input
                    type="checkbox"
                    checked={settings.showPhone}
                    onChange={(event) => setSetting('showPhone', event.target.checked)}
                  />
                  <span />
                </label>
              </div>
            </section>

            <section className="settings-section-modern muted">
              <h2><Lock size={16} />Security (Demo)</h2>
              <p>Password change API is not implemented yet in backend. Keep this section for future integration.</p>
            </section>
          </>
        )}

        <button type="button" className="settings-save-main" onClick={saveProfile} disabled={saving}>
          <Shield size={16} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </section>
  );
};

export default Settings;
