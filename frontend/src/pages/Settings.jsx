import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Shield,
  UserRound
} from 'lucide-react';
import CandidateWorkspace from '../components/CandidateWorkspace';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForUser, getRoleName } from '../utils/role';
import { getDisplayName, getProfileStrength } from '../utils/candidatePortal';
import api from '../services/api';
import { readCachedValue, writeCachedValue } from '../utils/pageCache';
import './Settings.css';

const SETTINGS_STORAGE_KEY = 'joblithic_settings';

const defaultSettings = {
  profileVisibility: 'public',
  showEmail: true,
  showPhone: true,
  emailNotifications: true,
  jobAlerts: true,
  weeklyDigest: true,
  preferredWorkMode: 'hybrid'
};

const defaultProfile = {
  id: null,
  fullName: '',
  email: '',
  phone: '',
  gender: '',
  location: '',
  dateOfBirth: '',
  skills: '',
  experience: '',
  tenthMarks: '',
  twelfthMarks: '',
  graduation: '',
  profileSummary: '',
  languages: '',
  internships: '',
  projects: '',
  certifications: '',
  resumeUrl: '',
  resumeFileName: '',
  companyName: '',
  companyLogoUrl: '',
  companyOverview: '',
  companyReviewSummary: '',
  companyReviewCount: 250
};

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
  const [workspaceSearch, setWorkspaceSearch] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const cacheKey = `settings-profile:${user?.username || 'guest'}`;

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

      const cachedProfile = readCachedValue(cacheKey, null);
      if (cachedProfile) {
        const nextProfile = { ...defaultProfile, ...cachedProfile };
        setProfile(nextProfile);
        setLoading(false);
      }

      try {
        const response = await api.get(`/users/username/${user.username}`);
        const nextProfile = { ...defaultProfile, ...response.data };
        setProfile(nextProfile);
        writeCachedValue(cacheKey, response.data);
      } catch {
        if (!cachedProfile) {
          setError('Failed to load profile settings.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.username]);

  const candidateStrength = useMemo(
    () => getProfileStrength(profile),
    [profile]
  );

  const setField = (name, value) => {
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const setSetting = (name, value) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
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
        gender: profile.gender,
        location: profile.location,
        dateOfBirth: profile.dateOfBirth,
        skills: profile.skills,
        experience: profile.experience,
        tenthMarks: profile.tenthMarks,
        twelfthMarks: profile.twelfthMarks,
        graduation: profile.graduation,
        profileSummary: profile.profileSummary,
        languages: profile.languages,
        internships: profile.internships,
        projects: profile.projects,
        certifications: profile.certifications,
        resumeUrl: profile.resumeUrl,
        resumeFileName: profile.resumeFileName,
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
              <p>Control profile visibility, recruiter contact preferences, and notification preferences in the updated candidate workspace.</p>
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
      <div className="container settings-card-modern">
        <header className="settings-header-modern">
          <div>
            <h1>Employer Settings Moved</h1>
            <p>Employer settings now live directly inside the recruiter dashboard so company updates stay in the same workspace.</p>
          </div>
          <Link to={`${getDashboardPathForUser(user)}?panel=settings`}>Open dashboard settings</Link>
        </header>
      </div>
    </section>
  );
};

export default Settings;
