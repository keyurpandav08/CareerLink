import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AtSign, Briefcase, Phone, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SkillTagInput from '../components/SkillTagInput';
import api from '../services/api';
import './EditProfile.css';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get(`/users/username/${user.username}`);
        setProfile(response.data);
        setFormData(response.data);
      } catch (requestError) {
        setError('Unable to load profile.');
      }
    };

    if (user?.username) {
      loadProfile();
    }
  }, [user]);

  const updateField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!profile?.id || !formData) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        fullName: formData.fullName?.trim(),
        email: formData.email?.trim(),
        phone: formData.phone?.trim(),
        skills: formData.skills,
        experience: formData.experience
      };

      const response = await api.put(`/users/${profile.id}`, payload);
      const updatedProfile = response.data;

      login({
        ...user,
        fullName: updatedProfile.fullName,
        email: updatedProfile.email
      });

      setMessage('Profile updated successfully.');
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Profile update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!formData) {
    return <div className="profile-edit-wrap">Loading profile...</div>;
  }

  return (
    <section className="profile-edit-wrap">
      <form className="profile-edit-card" onSubmit={handleSave}>
        <h1>Edit Candidate Profile</h1>
        <p>Keep your profile complete so recruiters can evaluate you faster.</p>

        {message && <div className="profile-alert ok">{message}</div>}
        {error && <div className="profile-alert bad">{error}</div>}

        <label htmlFor="fullName">Full Name</label>
        <div className="profile-input">
          <UserRound size={16} />
          <input
            id="fullName"
            value={formData.fullName || ''}
            onChange={(event) => updateField('fullName', event.target.value)}
            required
          />
        </div>

        <label htmlFor="email">Email</label>
        <div className="profile-input">
          <AtSign size={16} />
          <input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(event) => updateField('email', event.target.value)}
            required
          />
        </div>

        <label htmlFor="phone">Phone</label>
        <div className="profile-input">
          <Phone size={16} />
          <input
            id="phone"
            value={formData.phone || ''}
            onChange={(event) => updateField('phone', event.target.value)}
            required
          />
        </div>

        <label htmlFor="skills">Skills</label>
        <SkillTagInput
          value={formData.skills || ''}
          onChange={(next) => updateField('skills', next)}
          placeholder="Search skill and press Enter"
        />

        <label htmlFor="experience">Experience</label>
        <div className="profile-input">
          <Briefcase size={16} />
          <select
            id="experience"
            value={formData.experience || 'Fresher'}
            onChange={(event) => updateField('experience', event.target.value)}
          >
            <option value="Fresher">Fresher (0-1 years)</option>
            <option value="1-3 years">1-3 years</option>
            <option value="3-5 years">3-5 years</option>
            <option value="5-8 years">5-8 years</option>
            <option value="8+ years">8+ years</option>
          </select>
        </div>

        <button type="submit" className="profile-save-btn" disabled={saving}>
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </section>
  );
};

export default EditProfile;
