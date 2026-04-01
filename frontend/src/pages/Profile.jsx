import { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AtSign, ExternalLink, MapPin, ScrollText } from 'lucide-react';
import CandidateWorkspace from '../components/CandidateWorkspace';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  createInitials,
  formatRelativeDate,
  getDisplayName,
  getProfileMeta,
  getProfessionalTitle,
  getProfilePhoto,
  hasResume,
  parseStructuredEntries,
  parseTagList,
  resizeImageToDataUrl,
  saveProfileMeta,
} from '../utils/candidatePortal';
import { readCachedValue, writeCachedValue } from '../utils/pageCache';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [profileMeta, setProfileMeta] = useState({});
    const [popup, setPopup] = useState("");
  useEffect(() => {
    const loadProfile = async () => {
      const cacheKey = `candidate-profile:${user.username}`;
      const cachedProfile = readCachedValue(cacheKey, null);

      if (cachedProfile) {
        setProfile(cachedProfile);
      }

      try {
        const response = await api.get(`/users/username/${user.username}`);
        setProfile(response.data);
        writeCachedValue(cacheKey, response.data);
      } catch {
        if (!cachedProfile) {
          setError('Unable to load profile.');
        }
      }
    };

    if (user?.username) {
      setProfileMeta(getProfileMeta(user));
      loadProfile();
    }
  }, [user]);

  const displayName = useMemo(() => getDisplayName(profile, user), [profile, user]);
  const professionalTitle = useMemo(() => getProfessionalTitle(profile, user), [profile, user]);
  const profilePhoto = useMemo(
    () => profileMeta.profilePhoto || getProfilePhoto(user),
    [profileMeta.profilePhoto, user]
  );
  const coverImage = profileMeta.coverImage || '';
  const skills = useMemo(() => parseTagList(profile?.skills), [profile?.skills]);
  const internships = useMemo(() => parseStructuredEntries(profile?.internships), [profile?.internships]);
  const projects = useMemo(() => parseStructuredEntries(profile?.projects), [profile?.projects]);
  const certifications = useMemo(() => parseStructuredEntries(profile?.certifications), [profile?.certifications]);
const resumeRef = useRef();
  const handleCoverUpload = async (event) => {
    const [file] = Array.from(event.target.files || []);
    if (!file) return;

    try {
      const dataUrl = await resizeImageToDataUrl(file, 1440);
      saveProfileMeta(user, { coverImage: dataUrl });
      setProfileMeta((current) => ({ ...current, coverImage: dataUrl }));
    } catch {
      setError('Unable to update cover image.');
    } finally {
      event.target.value = '';
    }
  };
const handleResumeUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    // 👉 local preview URL
    const fileUrl = URL.createObjectURL(file);

    setProfile((prev) => ({
      ...prev,
      resumeUrl: fileUrl,
      resumeFileName: file.name,
    }));

    setPopup("Resume uploaded successfully");

    // auto hide after 2.5 sec
    setTimeout(() => {
      setPopup("");
    }, 2500);

  } catch (err) {
    console.error(err);
    alert("❌ Upload failed");
  }
};
const handleProfileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const dataUrl = await resizeImageToDataUrl(file, 420);

    saveProfileMeta(user, { profilePhoto: dataUrl });

    setProfileMeta((prev) => ({
      ...prev,
      profilePhoto: dataUrl
    }));
  } catch {
    setError("Failed to update profile photo");
  }
};
  if (!profile) {
    return (
      <CandidateWorkspace
        activePath="/profile"
        profile={profile}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search profile..."
      >
        <div className="candidate-profile-status">{error || 'Loading profile...'}</div>
      </CandidateWorkspace>
    );
  }

  return (
    <CandidateWorkspace
      activePath="/profile"
      profile={profile}
      searchValue={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder="Search profile..."

    >

      <div className="candidate-profile-page">
        <section className="candidate-profile-hero">

          <div
            className="candidate-profile-cover"
            style={coverImage ? { backgroundImage: `linear-gradient(135deg, rgba(7, 16, 33, 0.45), rgba(37, 99, 235, 0.18)), url(${coverImage})` } : undefined}
          >
            <label className="candidate-profile-cover-upload">
              <span>{coverImage ? 'Change Cover Image' : 'Add Cover Image'}</span>
              <input type="file" accept="image/*" onChange={handleCoverUpload} />
            </label>
          </div>

          <div className="candidate-profile-identity-card">
            <div className="candidate-profile-identity">
              <div
                className="candidate-profile-hero-avatar"
                onClick={() => document.getElementById("profileUpload").click()}
              >
                {profilePhoto
                  ? <img src={profilePhoto} alt={displayName} />
                  : createInitials(displayName)}

                <div className="avatar-overlay">Change</div>
              </div>

              <input
                type="file"
                id="profileUpload"
                accept="image/*"
                hidden
                onChange={handleProfileUpload}
              />

              <div className="candidate-profile-copy">
                <h1>{displayName}</h1>
                <p className="candidate-profile-subtitle">{professionalTitle}</p>
                <div className="candidate-profile-meta">
                  <span><MapPin size={15} /> {profile.location || 'Location not added'}</span>
                  <span><AtSign size={15} /> {profile.email || 'Email not added'}</span>
                  {profileMeta.portfolioUrl && <span><ExternalLink size={15} /> {profileMeta.portfolioUrl}</span>}
                </div>
              </div>
            </div>

            <div className="candidate-profile-actions">

              <Link to="/edit-profile" className="candidate-profile-edit-btn">Edit Profile</Link>
              {hasResume(profile.resumeUrl) && (
                <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="candidate-profile-share-btn">
                  <ExternalLink size={15} />
                </a>
              )}
            </div>
          </div>
        </section>

        <div className="candidate-profile-grid">
          <div className="candidate-profile-main">
            <section className="candidate-profile-card">
              <h2>Professional Narrative</h2>
              <p>
                {profile.profileSummary
                  || 'Add a profile summary to tell recruiters what you do best, what roles you want, and what makes your experience stand out.'}
              </p>
            </section>

            <section className="candidate-profile-card">
              <h2>Experience</h2>
              <div className="candidate-profile-list">
                {(internships.length ? internships : [{ title: 'Experience not added yet', summary: 'Use Edit Profile to add internships, projects, and measurable outcomes.' }]).map((item, index) => (
                  <article key={`${item.title || 'internship'}-${index}`} className="candidate-profile-entry">
                    <div className="candidate-profile-entry-icon">{index + 1}</div>
                    <div>
                      <h3>{item.title || 'Internship'}</h3>
                      <p className="candidate-profile-entry-subtitle">
                        {[item.company, item.role, item.duration].filter(Boolean).join(' • ') || professionalTitle}
                      </p>
                      <p>{item.summary || item.title}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="candidate-profile-card">
              <h2>Education</h2>
              <div className="candidate-profile-list">
                <div className="candidate-profile-entry">
                  <div className="candidate-profile-entry-icon">UG</div>
                  <div>
                    <h3>{profile.graduation || 'Education not added yet'}</h3>
                    <p>{profileMeta.collegeName || 'Add college name from edit profile'}</p>
                    {profileMeta.collegeLocation ? <p>{profileMeta.collegeLocation}</p> : null}
                  </div>
                </div>

                <div className="candidate-profile-entry">
                  <div className="candidate-profile-entry-icon">12</div>
                  <div>
                    <h3>{profileMeta.twelfthSchoolName || '12th school not added yet'}</h3>
                    <p>{profile.twelfthMarks ? `12th Marks / CGPA: ${profile.twelfthMarks}` : 'Add 12th marks or CGPA'}</p>
                  </div>
                </div>

                <div className="candidate-profile-entry">
                  <div className="candidate-profile-entry-icon">10</div>
                  <div>
                    <h3>{profileMeta.tenthSchoolName || '10th school not added yet'}</h3>
                    <p>{profile.tenthMarks ? `10th Marks / CGPA: ${profile.tenthMarks}` : 'Add 10th marks or CGPA'}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="candidate-profile-side">
            <section className="candidate-profile-card">
              <h2>Core Skills</h2>
              <div className="candidate-profile-skills">
                {(skills.length ? skills : ['Add skills from edit profile']).map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </section>

            <section className="candidate-profile-card">
              <h2>Resume</h2>

              <div className="candidate-profile-artifact">

                <div className="candidate-profile-artifact-head">

                  <div className="candidate-profile-artifact-icon">
                    <ScrollText size={18} />
                  </div>

                  <div className="candidate-profile-artifact-content">
                    <input
                      type="file"
                      ref={resumeRef}
                      hidden
                      accept=".pdf,.doc,.docx"
                      onChange={handleResumeUpload}
                    />
                    <div className={`resume-card ${hasResume(profile.resumeUrl) ? "success" : "empty"}`}>

                      <div className="resume-top">
                        <div className="resume-icon">
                          {hasResume(profile.resumeUrl) ? "✅" : "🚫"}
                        </div>

                        <div className="resume-text">
                          <h3>
                            {hasResume(profile.resumeUrl)
                              ? "Resume Added"
                              : "Resume Not Added"}
                          </h3>
                          <p>
                            {hasResume(profile.resumeUrl)
                              ? "Your resume is ready to be viewed"
                              : "Upload your resume to get better visibility"}
                          </p>
                        </div>
                      </div>

                      <div className="resume-actions">
                        {!hasResume(profile.resumeUrl) ? (
                         <button
                           className="btn primary"
                           onClick={() => resumeRef.current.click()}
                         >
                           Upload Resume
                         </button>
                        ) : (
                          <>
                            <a href={profile.resumeUrl} target="_blank" rel="noreferrer" className="btn view">
                              View
                            </a>
                            <button
                              className="btn update"
                              onClick={() => resumeRef.current.click()}
                            >
                              Update
                            </button>
                          </>
                        )}
                      </div>

                    </div>

                  </div>

                </div>

              </div>
              {popup && (
                <div className="popup-overlay">
                  <div className="popup-box">

                    <div className="popup-icon-box">
                      <span>✓</span>
                    </div>

                    <p>{popup}</p>

                  </div>
                </div>
              )}
            </section>

            <section className="candidate-profile-card">
              <h2>Connect</h2>
              <div className="candidate-profile-connect">
                <div>
                  <strong>Email</strong>
                  <span>{profile.email || 'Add email'}</span>
                </div>
                <div>
                  <strong>Phone</strong>
                  <span>{profile.phone || 'Add phone'}</span>
                </div>
                <div>
                  <strong>Certifications</strong>
                  <span>{certifications.length ? `${certifications.length} added` : 'No certifications added'}</span>
                </div>
                <div>
                  <strong>Portfolio</strong>
                  <span>{profileMeta.portfolioUrl || 'No portfolio URL added'}</span>
                </div>
                <div>
                  <strong>Projects</strong>
                  <span>{projects.length ? `${projects.length} added` : 'No projects added'}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </CandidateWorkspace>
  );
};

export default Profile;
