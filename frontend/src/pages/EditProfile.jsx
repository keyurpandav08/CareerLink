import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AtSign,
  Briefcase,
  CalendarDays,
  GraduationCap,
  Languages,
  MapPin,
  Phone,
  UserRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SkillTagInput from '../components/SkillTagInput';
import api from '../services/api';
import './EditProfile.css';

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali'];

const FORM_SECTIONS = [
  { id: 'basic', label: 'Basic details' },
  { id: 'education', label: 'Education' },
  { id: 'summary', label: 'Summary' },
  { id: 'experience', label: 'Experience' }
];

const InputField = ({ icon: Icon, label, id, ...inputProps }) => (
  <label className="profile-field" htmlFor={id}>
    <span>{label}</span>
    <div className="profile-input">
      <Icon size={16} />
      <input id={id} {...inputProps} />
    </div>
  </label>
);

const SelectField = ({ icon: Icon, label, id, children, ...inputProps }) => (
  <label className="profile-field" htmlFor={id}>
    <span>{label}</span>
    <div className="profile-input">
      <Icon size={16} />
      <select id={id} {...inputProps}>
        {children}
      </select>
    </div>
  </label>
);

const TextareaField = ({ label, id, ...inputProps }) => (
  <label className="profile-field" htmlFor={id}>
    <span>{label}</span>
    <textarea id={id} className="profile-textarea" {...inputProps} />
  </label>
);

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
      } catch {
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

  const profileStrength = useMemo(() => {
    if (!formData) return 0;

    const checkpoints = [
      formData.fullName,
      formData.email,
      formData.phone,
      formData.gender,
      formData.location,
      formData.dateOfBirth,
      formData.skills,
      formData.languages,
      formData.graduation,
      formData.profileSummary,
      formData.projects,
      formData.certifications
    ];

    return Math.round((checkpoints.filter(Boolean).length / checkpoints.length) * 100);
  }, [formData]);

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
        gender: formData.gender || null,
        location: formData.location?.trim(),
        dateOfBirth: formData.dateOfBirth || null,
        skills: formData.skills,
        experience: formData.experience,
        tenthMarks: formData.tenthMarks?.trim(),
        twelfthMarks: formData.twelfthMarks?.trim(),
        graduation: formData.graduation?.trim(),
        profileSummary: formData.profileSummary?.trim(),
        languages: formData.languages,
        internships: formData.internships?.trim(),
        projects: formData.projects?.trim(),
        certifications: formData.certifications?.trim()
      };

      const response = await api.put(`/users/${profile.id}`, payload);
      const updatedProfile = response.data;

      login({
        ...user,
        ...updatedProfile
      });

      setFormData(updatedProfile);
      setMessage('Profile updated successfully.');
      setTimeout(() => navigate('/dashboard'), 900);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Profile update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!formData) {
    return <div className="profile-edit-shell">Loading profile...</div>;
  }

  return (
    <section className="profile-edit-shell">
      <div className="container profile-edit-layout">
        <aside className="profile-edit-sidebar">
          <span className="profile-edit-kicker">Candidate profile</span>
          <h1>Present yourself like a serious hire.</h1>
          <p>
            Fill in the full story behind your profile so recruiters can assess your fit without chasing missing details.
          </p>

          <div className="profile-strength-card">
            <small>Profile strength</small>
            <strong>{profileStrength}%</strong>
            <div className="profile-strength-track">
              <span style={{ width: `${profileStrength}%` }} />
            </div>
            <p>Strong profiles get shortlisted faster and make your applications look more complete.</p>
          </div>

          <nav className="profile-section-nav">
            {FORM_SECTIONS.map((section) => (
              <a key={section.id} href={`#${section.id}`}>{section.label}</a>
            ))}
          </nav>

          <Link to="/dashboard" className="profile-back-link">Back to dashboard</Link>
        </aside>

        <form className="profile-edit-card" onSubmit={handleSave}>
          <div className="profile-edit-head">
            <div>
              <h2>Edit Candidate Profile</h2>
              <p>Keep your personal details, education, work samples, and supporting credentials up to date.</p>
            </div>
          </div>

          {message && <div className="profile-alert ok">{message}</div>}
          {error && <div className="profile-alert bad">{error}</div>}

          <section id="basic" className="profile-section-card">
            <div className="profile-section-head">
              <h3>Basic Details</h3>
              <p>Name, contact information, location, and identity basics.</p>
            </div>

            <div className="profile-grid two-up">
              <InputField
                icon={UserRound}
                id="fullName"
                label="Full Name"
                value={formData.fullName || ''}
                onChange={(event) => updateField('fullName', event.target.value)}
                required
              />
              <InputField
                icon={AtSign}
                id="email"
                type="email"
                label="Email"
                value={formData.email || ''}
                onChange={(event) => updateField('email', event.target.value)}
                required
              />
              <InputField
                icon={Phone}
                id="phone"
                label="Phone"
                value={formData.phone || ''}
                onChange={(event) => updateField('phone', event.target.value)}
              />
              <SelectField
                icon={UserRound}
                id="gender"
                label="Gender"
                value={formData.gender || ''}
                onChange={(event) => updateField('gender', event.target.value)}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </SelectField>
              <InputField
                icon={MapPin}
                id="location"
                label="Location"
                value={formData.location || ''}
                onChange={(event) => updateField('location', event.target.value)}
                placeholder="Ahmedabad, Gujarat"
              />
              <InputField
                icon={CalendarDays}
                id="dateOfBirth"
                type="date"
                label="Date of Birth"
                value={formData.dateOfBirth || ''}
                onChange={(event) => updateField('dateOfBirth', event.target.value)}
              />
            </div>
          </section>

          <section id="education" className="profile-section-card">
            <div className="profile-section-head">
              <h3>Education Information</h3>
              <p>Add academic context so employers can gauge fundamentals quickly.</p>
            </div>

            <div className="profile-grid two-up">
              <InputField
                icon={GraduationCap}
                id="tenthMarks"
                label="10th Marks / CGPA"
                value={formData.tenthMarks || ''}
                onChange={(event) => updateField('tenthMarks', event.target.value)}
                placeholder="85% or 8.6 CGPA"
              />
              <InputField
                icon={GraduationCap}
                id="twelfthMarks"
                label="12th Marks / CGPA"
                value={formData.twelfthMarks || ''}
                onChange={(event) => updateField('twelfthMarks', event.target.value)}
                placeholder="88% or 8.9 CGPA"
              />
            </div>

            <TextareaField
              id="graduation"
              label="Graduation"
              rows={3}
              value={formData.graduation || ''}
              onChange={(event) => updateField('graduation', event.target.value)}
              placeholder="B.E. Computer Engineering, Gujarat Technological University, 2026"
            />
          </section>

          <section id="summary" className="profile-section-card">
            <div className="profile-section-head">
              <h3>Profile Summary</h3>
              <p>Write a focused introduction that explains your value, direction, and strongest strengths.</p>
            </div>

            <TextareaField
              id="profileSummary"
              label="Professional Summary"
              rows={5}
              value={formData.profileSummary || ''}
              onChange={(event) => updateField('profileSummary', event.target.value)}
              placeholder="Motivated backend developer with hands-on project experience in Spring Boot, REST APIs, PostgreSQL, and secure authentication flows."
            />
          </section>

          <section id="experience" className="profile-section-card">
            <div className="profile-section-head">
              <h3>Experience And Credentials</h3>
              <p>Show the full depth of your work through skills, languages, internships, projects, and certifications.</p>
            </div>

            <div className="profile-grid two-up">
              <SelectField
                icon={Briefcase}
                id="experience"
                label="Experience"
                value={formData.experience || 'Fresher'}
                onChange={(event) => updateField('experience', event.target.value)}
              >
                <option value="Fresher">Fresher (0-1 years)</option>
                <option value="1-3 years">1-3 years</option>
                <option value="3-5 years">3-5 years</option>
                <option value="5-8 years">5-8 years</option>
                <option value="8+ years">8+ years</option>
              </SelectField>
            </div>

            <label className="profile-field" htmlFor="skills">
              <span>Key Skills</span>
              <SkillTagInput
                value={formData.skills || ''}
                onChange={(next) => updateField('skills', next)}
                placeholder="Search skill and press Enter"
              />
            </label>

            <label className="profile-field" htmlFor="languages">
              <span>Languages</span>
              <div className="profile-tag-wrap">
                <Languages size={16} />
                <SkillTagInput
                  value={formData.languages || ''}
                  onChange={(next) => updateField('languages', next)}
                  placeholder="Add spoken languages"
                  options={LANGUAGE_OPTIONS}
                />
              </div>
            </label>

            <TextareaField
              id="internships"
              label="Internship"
              rows={4}
              value={formData.internships || ''}
              onChange={(event) => updateField('internships', event.target.value)}
              placeholder="Role, company, duration, and the impact of the internship."
            />

            <TextareaField
              id="projects"
              label="Projects"
              rows={5}
              value={formData.projects || ''}
              onChange={(event) => updateField('projects', event.target.value)}
              placeholder="List your major projects, tech stack, responsibilities, and measurable outcomes."
            />

            <TextareaField
              id="certifications"
              label="Certifications"
              rows={4}
              value={formData.certifications || ''}
              onChange={(event) => updateField('certifications', event.target.value)}
              placeholder="Relevant courses, certifications, or badges that strengthen your profile."
            />
          </section>

          <div className="profile-save-row">
            <button type="submit" className="profile-save-btn" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default EditProfile;
