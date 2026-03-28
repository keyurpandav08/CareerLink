import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AtSign,
  Briefcase,
  CalendarDays,
  GraduationCap,
  Home,
  ImagePlus,
  Languages,
  MapPin,
  Phone,
  Save,
  Trash2,
  Upload,
  UserRound
} from 'lucide-react';
import CandidateWorkspace from '../components/CandidateWorkspace';
import SkillTagInput from '../components/SkillTagInput';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  createInitials,
  getDisplayName,
  getProfileMeta,
  getProfilePhoto,
  parseStructuredEntries,
  resizeImageToDataUrl,
  saveProfileMeta,
  serializeStructuredEntries
} from '../utils/candidatePortal';
import './EditProfile.css';

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Kannada', 'Bengali'];

const createInternship = () => ({ title: '', company: '', role: '', duration: '', summary: '' });
const createProject = () => ({ title: '', techStack: '', link: '', summary: '' });
const createCertification = () => ({ name: '', issuer: '', year: '', credentialUrl: '', attachmentName: '' });
const sanitizeNumericInput = (value) => {
  const cleaned = String(value || '').replace(/[^\d.]/g, '');
  const [whole = '', ...fractionParts] = cleaned.split('.');
  const fraction = fractionParts.join('');
  return fractionParts.length ? `${whole}.${fraction}` : whole;
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('Failed to read file'));
  reader.readAsDataURL(file);
});

const InputField = ({ icon, label, id, ...inputProps }) => {
  const FieldIcon = icon;

  return (
    <label className="edit-profile-field" htmlFor={id}>
      <span>{label}</span>
      <div className="edit-profile-input">
        <FieldIcon size={16} />
        <input id={id} {...inputProps} />
      </div>
    </label>
  );
};

const SelectField = ({ icon, label, id, children, ...inputProps }) => {
  const FieldIcon = icon;

  return (
    <label className="edit-profile-field" htmlFor={id}>
      <span>{label}</span>
      <div className="edit-profile-input">
        <FieldIcon size={16} />
        <select id={id} {...inputProps}>
          {children}
        </select>
      </div>
    </label>
  );
};

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(null);
  const [internships, setInternships] = useState([createInternship()]);
  const [projects, setProjects] = useState([createProject()]);
  const [certifications, setCertifications] = useState([createCertification()]);
  const [profileMeta, setProfileMeta] = useState({
    professionalTitle: '',
    portfolioUrl: '',
    publicProfileActive: true,
    profilePhoto: '',
    collegeName: '',
    collegeLocation: '',
    twelfthSchoolName: '',
    tenthSchoolName: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await api.get(`/users/username/${user.username}`);
        const nextProfile = response.data;
        const storedMeta = getProfileMeta(user);

        setProfile(nextProfile);
        setFormData(nextProfile);
        setInternships(parseStructuredEntries(nextProfile.internships).length ? parseStructuredEntries(nextProfile.internships) : [createInternship()]);
        setProjects(parseStructuredEntries(nextProfile.projects).length ? parseStructuredEntries(nextProfile.projects) : [createProject()]);
        setCertifications(parseStructuredEntries(nextProfile.certifications).length ? parseStructuredEntries(nextProfile.certifications) : [createCertification()]);
        setProfileMeta({
          professionalTitle: storedMeta.professionalTitle || '',
          portfolioUrl: storedMeta.portfolioUrl || '',
          publicProfileActive: storedMeta.publicProfileActive ?? true,
          profilePhoto: storedMeta.profilePhoto || '',
          collegeName: storedMeta.collegeName || '',
          collegeLocation: storedMeta.collegeLocation || '',
          twelfthSchoolName: storedMeta.twelfthSchoolName || '',
          tenthSchoolName: storedMeta.tenthSchoolName || ''
        });
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

  const updateCollectionItem = (setter, index, name, value) => {
    setter((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, [name]: value } : item)));
  };

  const removeCollectionItem = (setter, index, fallbackFactory) => {
    setter((prev) => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index);
      return next.length ? next : [fallbackFactory()];
    });
  };

  const profilePhoto = profileMeta.profilePhoto || getProfilePhoto(user);
  const displayName = useMemo(() => getDisplayName(formData, user), [formData, user]);

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const photo = await resizeImageToDataUrl(file, 420);
      setProfileMeta((prev) => ({ ...prev, profilePhoto: photo }));
      setMessage('Profile photo updated successfully.');
    } catch {
      setError('Failed to process profile photo. Try a smaller JPG or PNG.');
    }
  };

  const handleCertificateUpload = async (index, event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileDataUrl = await readFileAsDataUrl(file);
      setCertifications((prev) => prev.map((item, itemIndex) => (
        itemIndex === index
          ? { ...item, credentialUrl: fileDataUrl, attachmentName: file.name }
          : item
      )));
      setMessage('Certificate file attached successfully.');
      setError('');
    } catch {
      setError('Failed to attach certificate file.');
    } finally {
      event.target.value = '';
    }
  };

  const resetEditor = () => {
    if (!profile) return;
    const storedMeta = getProfileMeta(user);
    setFormData(profile);
    setInternships(parseStructuredEntries(profile.internships).length ? parseStructuredEntries(profile.internships) : [createInternship()]);
    setProjects(parseStructuredEntries(profile.projects).length ? parseStructuredEntries(profile.projects) : [createProject()]);
    setCertifications(parseStructuredEntries(profile.certifications).length ? parseStructuredEntries(profile.certifications) : [createCertification()]);
    setProfileMeta({
      professionalTitle: storedMeta.professionalTitle || '',
      portfolioUrl: storedMeta.portfolioUrl || '',
      publicProfileActive: storedMeta.publicProfileActive ?? true,
      profilePhoto: storedMeta.profilePhoto || '',
      collegeName: storedMeta.collegeName || '',
      collegeLocation: storedMeta.collegeLocation || '',
      twelfthSchoolName: storedMeta.twelfthSchoolName || '',
      tenthSchoolName: storedMeta.tenthSchoolName || ''
    });
    setMessage('');
    setError('');
  };

  const handleSave = async () => {
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
        tenthMarks: sanitizeNumericInput(formData.tenthMarks),
        twelfthMarks: sanitizeNumericInput(formData.twelfthMarks),
        graduation: formData.graduation?.trim(),
        profileSummary: formData.profileSummary?.trim(),
        languages: formData.languages,
        internships: serializeStructuredEntries(internships, ['title', 'company', 'role', 'duration', 'summary']),
        projects: serializeStructuredEntries(projects, ['title', 'techStack', 'link', 'summary']),
        certifications: serializeStructuredEntries(certifications, ['name', 'issuer', 'year', 'credentialUrl', 'attachmentName'])
      };

      const response = await api.put(`/users/${profile.id}`, payload);
      const updatedProfile = response.data;

      login({
        ...user,
        ...updatedProfile
      });

      saveProfileMeta(user, profileMeta);
      setProfile(updatedProfile);
      setFormData(updatedProfile);
      setMessage('Profile updated successfully.');
      setTimeout(() => navigate('/profile'), 900);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Profile update failed.');
    } finally {
      setSaving(false);
    }
  };

  if (!formData) {
    return (
      <CandidateWorkspace
        activePath="/profile"
        profile={profile}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        searchPlaceholder="Search profile editor..."
      >
        <div className="edit-profile-status">Loading profile editor...</div>
      </CandidateWorkspace>
    );
  }

  return (
    <CandidateWorkspace
      activePath="/profile"
      profile={{ ...formData, fullName: formData.fullName }}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      searchPlaceholder="Search profile editor..."
    >
      <div className="edit-profile-page">
        <header className="edit-profile-header">
          <div>
            <h1>Edit Profile</h1>
            <p>Curate your professional narrative and refine how recruiters see your journey.</p>
          </div>

          <div className="edit-profile-header-actions">
            <Link to="/" className="edit-profile-home-btn">
              <Home size={16} />
              Home
            </Link>
            <button type="button" className="edit-profile-discard-btn" onClick={resetEditor}>Discard</button>
            <button type="button" className="edit-profile-save-top-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </header>

        {message && <div className="edit-profile-alert ok">{message}</div>}
        {error && <div className="edit-profile-alert bad">{error}</div>}

        <div className="edit-profile-grid">
          <aside className="edit-profile-sidebar">
            <section className="edit-profile-avatar-card">
              <div className="edit-profile-avatar-frame">
                <div
                  className="edit-profile-avatar"
                  onClick={() => document.getElementById("profileUploadInput").click()}
                >
                  {profilePhoto
                    ? <img src={profilePhoto} alt={displayName} />
                    : createInitials(displayName)}
                </div>

                <input
                  type="file"
                  id="profileUploadInput"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  hidden
                />
              </div>

              <h2>{displayName}</h2>
              <p>{profileMeta.professionalTitle || 'Add your professional title'}</p>

              <div className="edit-profile-toggle-card">
                <span>{profileMeta.publicProfileActive ? 'Public Profile Active' : 'Private Profile'}</span>
              </div>
            </section>

            <section className="edit-profile-sidebar-card">
              <div className="edit-profile-strength-row">
                <span>Profile Strength</span>
                <strong>{Math.min(100, Math.round(((Object.values(formData).filter(Boolean).length + Object.values(profileMeta).filter(Boolean).length) / 18) * 100))}%</strong>
              </div>
              <div className="edit-profile-strength-bar">
                <span style={{ width: `${Math.min(100, Math.round(((Object.values(formData).filter(Boolean).length + Object.values(profileMeta).filter(Boolean).length) / 18) * 100))}%` }} />
              </div>
              <p>Add a professional bio, project details, and avatar to strengthen your profile.</p>
            </section>
          </aside>

          <div className="edit-profile-main">
            <section className="edit-profile-card">
              <div className="edit-profile-card-head">
                <UserRound size={18} />
                <h3>Personal Information</h3>
              </div>

              <div className="edit-profile-form-grid">
                <InputField
                  icon={UserRound}
                  id="fullName"
                  label="Full Name"
                  value={formData.fullName || ''}
                  onChange={(event) => updateField('fullName', event.target.value)}
                />
                <InputField
                  icon={Briefcase}
                  id="professionalTitle"
                  label="Professional Title"
                  value={profileMeta.professionalTitle}
                  onChange={(event) => setProfileMeta((prev) => ({ ...prev, professionalTitle: event.target.value }))}
                  placeholder="Senior Product Designer"
                />
                <InputField
                  icon={AtSign}
                  id="email"
                  label="Email"
                  type="email"
                  value={formData.email || ''}
                  onChange={(event) => updateField('email', event.target.value)}
                />
                <InputField
                  icon={Phone}
                  id="phone"
                  label="Phone"
                  value={formData.phone || ''}
                  onChange={(event) => updateField('phone', event.target.value)}
                />
                <InputField
                  icon={MapPin}
                  id="location"
                  label="Location"
                  value={formData.location || ''}
                  onChange={(event) => updateField('location', event.target.value)}
                />
                <InputField
                  icon={CalendarDays}
                  id="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth || ''}
                  onChange={(event) => updateField('dateOfBirth', event.target.value)}
                />
                <InputField
                  icon={AtSign}
                  id="portfolioUrl"
                  label="Portfolio URL"
                  value={profileMeta.portfolioUrl}
                  onChange={(event) => setProfileMeta((prev) => ({ ...prev, portfolioUrl: event.target.value }))}
                  placeholder="https://yourportfolio.com"
                />
                <SelectField
                  icon={UserRound}
                  id="experience"
                  label="Experience Level"
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

              <label className="edit-profile-field">
                <span>Professional Bio</span>
                <textarea
                  className="edit-profile-textarea"
                  rows={4}
                  value={formData.profileSummary || ''}
                  onChange={(event) => updateField('profileSummary', event.target.value)}
                  placeholder="Architecting digital experiences at the intersection of human psychology and scalable systems."
                />
              </label>
            </section>

            <section className="edit-profile-card">
              <div className="edit-profile-card-head">
                <Briefcase size={18} />
                <h3>Professional Experience</h3>
                <button type="button" className="edit-profile-add-btn" onClick={() => setInternships((prev) => [...prev, createInternship()])}>
                  Add Experience
                </button>
              </div>

              <div className="edit-profile-stack">
                {internships.map((item, index) => (
                  <article key={`internship-${index}`} className="edit-profile-entry-card">
                    <div className="edit-profile-entry-head">
                      <strong>Experience {index + 1}</strong>
                      <button type="button" onClick={() => removeCollectionItem(setInternships, index, createInternship)}>
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="edit-profile-form-grid">
                      <InputField
                        icon={Briefcase}
                        id={`internship-title-${index}`}
                        label="Title"
                        value={item.title || ''}
                        onChange={(event) => updateCollectionItem(setInternships, index, 'title', event.target.value)}
                      />
                      <InputField
                        icon={Briefcase}
                        id={`internship-company-${index}`}
                        label="Company Name"
                        value={item.company || ''}
                        onChange={(event) => updateCollectionItem(setInternships, index, 'company', event.target.value)}
                      />
                      <InputField
                        icon={UserRound}
                        id={`internship-role-${index}`}
                        label="Role"
                        value={item.role || ''}
                        onChange={(event) => updateCollectionItem(setInternships, index, 'role', event.target.value)}
                      />
                      <InputField
                        icon={CalendarDays}
                        id={`internship-duration-${index}`}
                        label="Duration"
                        value={item.duration || ''}
                        onChange={(event) => updateCollectionItem(setInternships, index, 'duration', event.target.value)}
                        placeholder="Jan 2024 - Jun 2024"
                      />
                    </div>

                    <label className="edit-profile-field">
                      <span>What did you do?</span>
                      <textarea
                        className="edit-profile-textarea"
                        rows={3}
                        value={item.summary || ''}
                        onChange={(event) => updateCollectionItem(setInternships, index, 'summary', event.target.value)}
                        placeholder="Describe your responsibilities, impact, and outcomes."
                      />
                    </label>
                  </article>
                ))}
              </div>
            </section>

            <div className="edit-profile-bento">
              <section className="edit-profile-card">
                <div className="edit-profile-card-head">
                  <GraduationCap size={18} />
                  <h3>Education</h3>
                </div>

              <div className="edit-profile-form-grid">
                <InputField
                  icon={GraduationCap}
                  id="collegeName"
                  label="College Name"
                  value={profileMeta.collegeName}
                  onChange={(event) => setProfileMeta((prev) => ({ ...prev, collegeName: event.target.value }))}
                  placeholder="Government Engineering College"
                />
                <InputField
                  icon={MapPin}
                  id="collegeLocation"
                  label="College Location"
                  value={profileMeta.collegeLocation}
                  onChange={(event) => setProfileMeta((prev) => ({ ...prev, collegeLocation: event.target.value }))}
                  placeholder="Ahmedabad, Gujarat"
                />
                <InputField
                  icon={GraduationCap}
                  id="graduation"
                  label="Degree / Graduation"
                  value={formData.graduation || ''}
                  onChange={(event) => updateField('graduation', event.target.value)}
                  placeholder="B.Sc. IT / B.E. Computer Engineering"
                />
                <InputField
                  icon={GraduationCap}
                  id="twelfthSchoolName"
                  label="12th School Name"
                  value={profileMeta.twelfthSchoolName}
                  onChange={(event) => setProfileMeta((prev) => ({ ...prev, twelfthSchoolName: event.target.value }))}
                  placeholder="School or junior college name"
                />
                <InputField
                  icon={GraduationCap}
                  id="twelfthMarks"
                  label="12th Marks / CGPA"
                  value={formData.twelfthMarks || ''}
                  onChange={(event) => updateField('twelfthMarks', sanitizeNumericInput(event.target.value))}
                  inputMode="decimal"
                  placeholder="78.80"
                />
                <InputField
                  icon={GraduationCap}
                  id="tenthSchoolName"
                  label="10th School Name"
                  value={profileMeta.tenthSchoolName}
                  onChange={(event) => setProfileMeta((prev) => ({ ...prev, tenthSchoolName: event.target.value }))}
                  placeholder="School name"
                />
                <InputField
                  icon={GraduationCap}
                  id="tenthMarks"
                  label="10th Marks / CGPA"
                  value={formData.tenthMarks || ''}
                  onChange={(event) => updateField('tenthMarks', sanitizeNumericInput(event.target.value))}
                  inputMode="decimal"
                  placeholder="89.40"
                />
              </div>
            </section>

              <section className="edit-profile-card">
                <div className="edit-profile-card-head">
                  <Languages size={18} />
                  <h3>Skills and Languages</h3>
                </div>

                <label className="edit-profile-field">
                  <span>Skills</span>
                  <div className="edit-profile-tag-box">
                    <SkillTagInput
                      value={formData.skills || ''}
                      onChange={(next) => updateField('skills', next)}
                      placeholder="Search skill and press Enter"
                    />
                  </div>
                </label>

                <label className="edit-profile-field">
                  <span>Languages</span>
                  <div className="edit-profile-tag-box">
                    <SkillTagInput
                      value={formData.languages || ''}
                      onChange={(next) => updateField('languages', next)}
                      placeholder="Add spoken languages"
                      options={LANGUAGE_OPTIONS}
                    />
                  </div>
                </label>
              </section>
            </div>

            <section className="edit-profile-card">
              <div className="edit-profile-card-head">
                <Briefcase size={18} />
                <h3>Projects</h3>
                <button type="button" className="edit-profile-add-btn" onClick={() => setProjects((prev) => [...prev, createProject()])}>
                  Add Project
                </button>
              </div>

              <div className="edit-profile-stack">
                {projects.map((item, index) => (
                  <article key={`project-${index}`} className="edit-profile-entry-card">
                    <div className="edit-profile-entry-head">
                      <strong>Project {index + 1}</strong>
                      <button type="button" onClick={() => removeCollectionItem(setProjects, index, createProject)}>
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="edit-profile-form-grid">
                      <InputField
                        icon={Briefcase}
                        id={`project-title-${index}`}
                        label="Project Title"
                        placeholder="e.g, Job Portal System"
                        value={item.title || ''}
                        onChange={(event) => updateCollectionItem(setProjects, index, 'title', event.target.value)}
                      />
                      <InputField
                        icon={Briefcase}
                        id={`project-stack-${index}`}
                        label="Tech Stack"
                        value={item.techStack || ''}
                        onChange={(event) => updateCollectionItem(setProjects, index, 'techStack', event.target.value)}
                        placeholder="React, Spring Boot, MySQL"
                      />
                      <InputField
                        icon={AtSign}
                        id={`project-link-${index}`}
                        label="Project Link"
                        value={item.link || ''}
                        onChange={(event) => updateCollectionItem(setProjects, index, 'link', event.target.value)}
                        placeholder="https://github.com/..."
                      />
                    </div>

                    <label className="edit-profile-field">
                      <span>Project Summary</span>
                      <textarea
                        className="edit-profile-textarea"
                        rows={3}
                        value={item.summary || ''}
                        onChange={(event) => updateCollectionItem(setProjects, index, 'summary', event.target.value)}
                        placeholder="Explain the problem, your role, and measurable outcomes."
                      />
                    </label>
                  </article>
                ))}
              </div>
            </section>

            <section className="edit-profile-card">
              <div className="edit-profile-card-head">
                <GraduationCap size={18} />
                <h3>Certifications</h3>
                <button type="button" className="edit-profile-add-btn" onClick={() => setCertifications((prev) => [...prev, createCertification()])}>
                  Add Certification
                </button>
              </div>

              <div className="edit-profile-stack">
                {certifications.map((item, index) => (
                  <article key={`certification-${index}`} className="edit-profile-entry-card">
                    <div className="edit-profile-entry-head">
                      <strong>Certification {index + 1}</strong>
                      <button type="button" onClick={() => removeCollectionItem(setCertifications, index, createCertification)}>
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="edit-profile-form-grid">
                      <InputField
                        icon={GraduationCap}
                        id={`certification-name-${index}`}
                        label="Certification Name"
                        value={item.name || ''}
                        placeholder="e.g. AWS Certified Solutions Architect"
                        onChange={(event) => updateCollectionItem(setCertifications, index, 'name', event.target.value)}
                      />
                      <InputField
                        icon={GraduationCap}
                        id={`certification-issuer-${index}`}
                        label="Issuer"
                        value={item.issuer || ''}
                        placeholder="e.g. Amazon Web Services (AWS)"
                        onChange={(event) => updateCollectionItem(setCertifications, index, 'issuer', event.target.value)}
                      />
                      <InputField
                        icon={CalendarDays}
                        id={`certification-year-${index}`}
                        label="Year"
                        value={item.year || ''}
                        onChange={(event) => updateCollectionItem(setCertifications, index, 'year', event.target.value.replace(/[^\d]/g, '').slice(0, 4))}
                        inputMode="numeric"
                        placeholder="2025"
                      />
                      <InputField
                        icon={AtSign}
                        id={`certification-url-${index}`}
                        label="Credential URL"
                        value={item.credentialUrl || ''}
                        placeholder="e.g. https://www.credly.com/badges/your-certificate-link"
                        onChange={(event) => updateCollectionItem(setCertifications, index, 'credentialUrl', event.target.value)}
                      />
                    </div>

                    <div className="edit-profile-cert-upload-row">
                      <label className="edit-profile-cert-upload-btn">
                        <Upload size={15} />
                        Upload Certificate
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={(event) => handleCertificateUpload(index, event)}
                          hidden
                        />
                      </label>
                      <span className="edit-profile-cert-file-name">
                        {item.attachmentName || 'No file attached'}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="edit-profile-footer-card">
              <div>
                <strong>Open to Opportunities</strong>
                <p>Allow recruiters to find your profile in searches.</p>
              </div>
              <label className="switch-btn">
                <input
                  type="checkbox"
                  checked={profileMeta.publicProfileActive}
                  onChange={(event) => setProfileMeta((prev) => ({ ...prev, publicProfileActive: event.target.checked }))}
                />
                <span />
              </label>
            </section>

            <div className="edit-profile-save-row">
              <button type="button" className="edit-profile-save-bottom-btn" onClick={handleSave} disabled={saving}>
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </CandidateWorkspace>
  );
};

export default EditProfile;
