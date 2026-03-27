import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Building2,
  Globe2,
  ImageUp,
  KeyRound,
  Lock,
  Shield,
  UserRound
} from 'lucide-react';
import CandidateWorkspace from '../components/CandidateWorkspace';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForUser, getRoleName } from '../utils/role';
import { getDisplayName, getProfileStrength } from '../utils/candidatePortal';
import api from '../services/api';
import './Settings.css';

const SETTINGS_STORAGE_KEY = 'joblithic_settings';

const defaultSettings = {
  profileVisibility: 'public',
  showEmail: true,
  showPhone: true,
  emailNotifications: true,
  jobAlerts: true,
  weeklyDigest: true,
  preferredWorkMode: 'hybrid',
  geminiApiKey: ''
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
  const [workspaceSearch, setWorkspaceSearch] = useState('');

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

  const candidateStrength = useMemo(
    () => getProfileStrength(profile, [settings.geminiApiKey]),
    [profile, settings.geminiApiKey]
  );

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

  if (!isEmployer) {
    return (
      <CandidateWorkspace
        activePath="/settings"
        profile={profile}
        searchValue={workspaceSearch}
        onSearchChange={setWorkspaceSearch}
        searchPlaceholder="Search settings..."
      >
        <div className="candidate-settings-page">
          <section className="candidate-settings-hero">
            <div>
              <span>Account settings</span>
              <h1>{getDisplayName(profile, user)}</h1>
              <p>Control profile visibility, recruiter contact preferences, notifications, and the local Gemini key placeholder used for future AI upgrades.</p>
            </div>

            <div className="candidate-settings-strength">
              <strong>{candidateStrength}%</strong>
              <small>Workspace readiness</small>
            </div>
          </section>

          {banner && <div className="candidate-settings-banner">{banner}</div>}
          {error && <div className="candidate-settings-error">{error}</div>}

          <div className="candidate-settings-grid">
            <section className="candidate-settings-card">
              <h2><UserRound size={16} />Account Basics</h2>

              <div className="candidate-settings-field-grid">
                <label>
                  <span>Full Name</span>
                  <input
                    value={profile.fullName || ''}
                    onChange={(event) => setField('fullName', event.target.value)}
                    placeholder="Your full name"
                  />
                </label>

                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={profile.email || ''}
                    onChange={(event) => setField('email', event.target.value)}
                    placeholder="you@example.com"
                  />
                </label>

                <label>
                  <span>Phone</span>
                  <input
                    value={profile.phone || ''}
                    onChange={(event) => setField('phone', event.target.value)}
                    placeholder="+91 98xxxxxx10"
                  />
                </label>

                <label>
                  <span>Preferred Work Mode</span>
                  <select
                    value={settings.preferredWorkMode}
                    onChange={(event) => setSetting('preferredWorkMode', event.target.value)}
                  >
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </label>
              </div>
            </section>

            <section className="candidate-settings-card">
              <h2><Shield size={16} />Visibility</h2>

              <label className="candidate-settings-row">
                <span>Profile visibility</span>
                <select
                  value={settings.profileVisibility}
                  onChange={(event) => setSetting('profileVisibility', event.target.value)}
                >
                  <option value="public">Public</option>
                  <option value="recruiters">Recruiters only</option>
                  <option value="private">Private</option>
                </select>
              </label>

              <div className="candidate-settings-switch">
                <div>
                  <strong>Show email</strong>
                  <span>Allow recruiters to contact you by email.</span>
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

              <div className="candidate-settings-switch">
                <div>
                  <strong>Show phone</strong>
                  <span>Allow direct contact for shortlisted roles.</span>
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

            <section className="candidate-settings-card">
              <h2><Bell size={16} />Notifications</h2>

              <div className="candidate-settings-switch">
                <div>
                  <strong>Email notifications</strong>
                  <span>Stay updated when your applications move.</span>
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

              <div className="candidate-settings-switch">
                <div>
                  <strong>Job alerts</strong>
                  <span>Receive role recommendations based on your profile.</span>
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

              <div className="candidate-settings-switch">
                <div>
                  <strong>Weekly digest</strong>
                  <span>Bundle recommendations into a weekly summary.</span>
                </div>
                <label className="switch-btn">
                  <input
                    type="checkbox"
                    checked={settings.weeklyDigest}
                    onChange={(event) => setSetting('weeklyDigest', event.target.checked)}
                  />
                  <span />
                </label>
              </div>
            </section>

            <section className="candidate-settings-card">
              <h2><KeyRound size={16} />AI Preferences</h2>

              <label className="candidate-settings-field">
                <span>Gemini API Key</span>
                <input
                  type="password"
                  value={settings.geminiApiKey}
                  onChange={(event) => setSetting('geminiApiKey', event.target.value)}
                  placeholder="Optional key stored only in local settings"
                />
              </label>

              <div className="candidate-settings-note">
                The current resume insights page still uses the original backend analysis API. This key is saved locally so the UI is ready for a future Gemini-backed upgrade without changing your existing flow today.
              </div>

              <div className="candidate-settings-security">
                <Lock size={16} />
                <span>Password change API is not implemented yet, so this remains a future integration point.</span>
              </div>
            </section>
          </div>

          <div className="candidate-settings-save-row">
            <button type="button" className="settings-save-main" onClick={saveProfile} disabled={saving}>
              <Shield size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </CandidateWorkspace>
    );
  }

  return (
    <section className="settings-shell">
      <div className="container settings-card-modern employer-settings-card">
        <header className="settings-header-modern">
          <div>
            <h1>Employer Profile Studio</h1>
            <p>Manage company branding, recruiter details, profile strength, and candidate communication settings.</p>
          </div>
          <Link to={getDashboardPathForUser(user)}>Back to dashboard</Link>
        </header>

        {banner && <div className="settings-banner">{banner}</div>}
        {error && <div className="settings-error">{error}</div>}

        <section className="settings-hero">
          <div>
            <span className="settings-kicker">Naukri-style company profile</span>
            <h2>{profile.companyName || 'Complete your company profile'}</h2>
            <p>A strong employer profile increases trust and gives your job pages a more professional look.</p>
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

        <button type="button" className="settings-save-main" onClick={saveProfile} disabled={saving}>
          <Shield size={16} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </section>
  );
};

export default Settings;
