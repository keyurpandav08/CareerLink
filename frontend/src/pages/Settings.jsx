import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Eye, Lock, Shield, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getDashboardPathForUser, getRoleName } from '../utils/role';
import './Settings.css';

const SETTINGS_STORAGE_KEY = 'joblithic_settings';

const defaultSettings = {
  profileVisibility: 'public',
  showEmail: true,
  showPhone: true,
  emailNotifications: true,
  jobAlerts: true
};

const Settings = () => {
  const { user } = useAuth();
  const roleName = getRoleName(user);
  const [settings, setSettings] = useState(defaultSettings);
  const [banner, setBanner] = useState('');

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
      setSettings({ ...defaultSettings, ...stored });
    } catch (parsingError) {
      setSettings(defaultSettings);
    }
  }, []);

  const setField = (name, value) => {
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const saveSettings = () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    setBanner('Settings saved.');
    setTimeout(() => setBanner(''), 1200);
  };

  return (
    <section className="settings-shell">
      <div className="container settings-card-modern">
        <header className="settings-header-modern">
          <div>
            <h1>Account Settings</h1>
            <p>Manage visibility, notifications, and account preferences.</p>
          </div>
          <Link to={getDashboardPathForUser(user)}>Back to dashboard</Link>
        </header>

        {banner && <div className="settings-banner">{banner}</div>}

        <section className="settings-section-modern">
          <h2><UserRound size={16} />Profile Visibility</h2>
          <div className="settings-row">
            <label htmlFor="profileVisibility">Who can view my profile?</label>
            <select
              id="profileVisibility"
              value={settings.profileVisibility}
              onChange={(event) => setField('profileVisibility', event.target.value)}
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
                onChange={(event) => setField('showEmail', event.target.checked)}
              />
              <span />
            </label>
          </div>
          {roleName !== 'EMPLOYER' && (
            <div className="switch-row">
              <div>
                <strong>Show phone</strong>
                <span>Allow direct phone contact for shortlisted roles</span>
              </div>
              <label className="switch-btn">
                <input
                  type="checkbox"
                  checked={settings.showPhone}
                  onChange={(event) => setField('showPhone', event.target.checked)}
                />
                <span />
              </label>
            </div>
          )}
        </section>

        <section className="settings-section-modern">
          <h2><Bell size={16} />Notifications</h2>
          <div className="switch-row">
            <div>
              <strong>Email notifications</strong>
              <span>Application updates and hiring actions</span>
            </div>
            <label className="switch-btn">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(event) => setField('emailNotifications', event.target.checked)}
              />
              <span />
            </label>
          </div>
          <div className="switch-row">
            <div>
              <strong>{roleName === 'EMPLOYER' ? 'Candidate alerts' : 'Job alerts'}</strong>
              <span>{roleName === 'EMPLOYER' ? 'Get notified when new candidates apply' : 'Get matched opening alerts'}</span>
            </div>
            <label className="switch-btn">
              <input
                type="checkbox"
                checked={settings.jobAlerts}
                onChange={(event) => setField('jobAlerts', event.target.checked)}
              />
              <span />
            </label>
          </div>
        </section>

        <section className="settings-section-modern muted">
          <h2><Lock size={16} />Security (Demo)</h2>
          <p>Password change API is not implemented yet in backend. Keep this section for future integration.</p>
        </section>

        <section className="settings-section-modern muted">
          <h2><Eye size={16} />Privacy Note</h2>
          <p>
            These settings currently apply at UI level for demo flow and can be expanded into backend-stored preferences later.
          </p>
        </section>

        <button type="button" className="settings-save-main" onClick={saveSettings}>
          <Shield size={16} />
          Save Settings
        </button>
      </div>
    </section>
  );
};

export default Settings;
