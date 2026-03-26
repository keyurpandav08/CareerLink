import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  Mail,
  Phone,
  Search,
  Sparkles,
  Target,
  UploadCloud,
  UserRound,
  XCircle
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Dashboard.css';

const parseSkills = (value) =>
  (value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const createInitials = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JL';

const getStatusMeta = (status) => {
  switch (status) {
    case 'ACCEPTED':
      return { label: 'Accepted', className: 'accepted', icon: <CheckCircle2 size={14} /> };
    case 'REJECTED':
      return { label: 'Rejected', className: 'rejected', icon: <XCircle size={14} /> };
    case 'REVIEWED':
      return { label: 'Reviewed', className: 'reviewed', icon: <Sparkles size={14} /> };
    default:
      return { label: 'Pending', className: 'pending', icon: <Clock3 size={14} /> };
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumePreviewUrl, setResumePreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  useEffect(() => {
    applications.forEach((application) => {
      const key = `status_${application.id}`;
      const previousStatus = localStorage.getItem(key);

      if (application.status === 'ACCEPTED' && previousStatus !== 'ACCEPTED') {
        toast.success('Congratulations! Your application was accepted.');
        localStorage.setItem(key, 'ACCEPTED');
      }

      if (application.status === 'REJECTED' && previousStatus !== 'REJECTED') {
        toast.error('This application was marked as rejected.');
        localStorage.setItem(key, 'REJECTED');
      }
    });
  }, [applications]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const profileRes = await api.get(`/users/username/${user.username}`);
        setProfile(profileRes.data);

        const applicationsRes = await api.get(`/applications/user/${profileRes.data.id}`);
        setApplications(Array.isArray(applicationsRes.data) ? applicationsRes.data : []);
      } catch {
        setError('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      loadData();
    }
  }, [user]);

  useEffect(() => () => {
    if (resumePreviewUrl) {
      URL.revokeObjectURL(resumePreviewUrl);
    }
  }, [resumePreviewUrl]);

  const applicationStats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((item) => item.status === 'PENDING').length;
    const reviewed = applications.filter((item) => item.status === 'REVIEWED').length;
    const accepted = applications.filter((item) => item.status === 'ACCEPTED').length;
    const rejected = applications.filter((item) => item.status === 'REJECTED').length;

    return { total, pending, reviewed, accepted, rejected };
  }, [applications]);

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;

    const checks = [
      Boolean(profile.fullName),
      Boolean(profile.email),
      Boolean(profile.phone),
      Boolean(profile.skills),
      Boolean(profile.experience)
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [profile]);

  const savedJobsCount = useMemo(() => {
    try {
      const savedJobs = JSON.parse(localStorage.getItem('savedJobs') || '[]');
      return Array.isArray(savedJobs) ? savedJobs.length : 0;
    } catch {
      return 0;
    }
  }, []);

  const skills = useMemo(() => parseSkills(profile?.skills), [profile?.skills]);
  const recentApplications = useMemo(() => applications.slice(0, 5), [applications]);
  const acceptedRate = applicationStats.total
    ? Math.round((applicationStats.accepted / applicationStats.total) * 100)
    : 0;

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (resumePreviewUrl) {
      URL.revokeObjectURL(resumePreviewUrl);
    }

    setResumeFile(file);
    setResumePreviewUrl(URL.createObjectURL(file));
    setUploadMessage('');
  };

  const handleResumeUpload = async () => {
    if (!resumeFile || !profile?.id) return;

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('userId', profile.id);

    try {
      setUploading(true);
      setUploadMessage('');
      const response = await api.post('/users/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data?.user) {
        setProfile(response.data.user);
      }
      setUploadMessage('Resume uploaded successfully.');
      setResumeFile(null);
      if (resumePreviewUrl) {
        URL.revokeObjectURL(resumePreviewUrl);
        setResumePreviewUrl('');
      }
    } catch {
      setUploadMessage('Resume upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <section className="candidate-dashboard-shell">Loading dashboard...</section>;
  }

  if (!profile) {
    return <section className="candidate-dashboard-shell">{error || 'Profile not found.'}</section>;
  }

  return (
    <section className="candidate-dashboard-shell">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="container candidate-dashboard-layout">
        <header className="candidate-dashboard-hero">
          <div className="candidate-dashboard-hero-copy">
            <span className="candidate-dashboard-kicker">Applicant workspace</span>
            <h1>Build momentum in your job search.</h1>
            <p>
              Track application progress, improve profile strength, and keep your resume ready for faster shortlisting.
            </p>

            <div className="candidate-dashboard-hero-actions">
              <Link to="/jobs" className="candidate-primary-link">
                Explore roles
                <ArrowRight size={16} />
              </Link>
              <Link to="/applications" className="candidate-secondary-link">Review pipeline</Link>
            </div>
          </div>

          <div className="candidate-dashboard-hero-panel">
            <div className="candidate-profile-summary">
              <div className="candidate-profile-avatar">{createInitials(profile.fullName)}</div>
              <div>
                <strong>{profile.fullName}</strong>
                <span>{profile.experience || 'Experience not added yet'}</span>
              </div>
            </div>

            <div className="candidate-hero-metrics">
              <article>
                <small>Profile strength</small>
                <strong>{profileCompletion}%</strong>
              </article>
              <article>
                <small>Saved jobs</small>
                <strong>{savedJobsCount}</strong>
              </article>
              <article>
                <small>Acceptance rate</small>
                <strong>{acceptedRate}%</strong>
              </article>
            </div>
          </div>
        </header>

        <section className="candidate-dashboard-metrics">
          <article className="metric-card">
            <span>Total applications</span>
            <strong>{applicationStats.total}</strong>
            <p>Everything you have submitted so far.</p>
          </article>
          <article className="metric-card">
            <span>Pending review</span>
            <strong>{applicationStats.pending}</strong>
            <p>Applications still waiting on recruiter action.</p>
          </article>
          <article className="metric-card">
            <span>Reviewed</span>
            <strong>{applicationStats.reviewed}</strong>
            <p>Profiles that have already moved into evaluation.</p>
          </article>
          <article className="metric-card">
            <span>Offers won</span>
            <strong>{applicationStats.accepted}</strong>
            <p>Applications that reached an accepted outcome.</p>
          </article>
        </section>

        <div className="candidate-dashboard-grid">
          <aside className="candidate-dashboard-sidebar">
            <article className="candidate-sidebar-card">
              <div className="candidate-sidebar-heading">
                <h2>Profile snapshot</h2>
                <Link to="/edit-profile">Edit</Link>
              </div>

              <div className="candidate-profile-list">
                <div><UserRound size={16} /><span>{profile.fullName}</span></div>
                <div><Mail size={16} /><span>{profile.email}</span></div>
                <div><Phone size={16} /><span>{profile.phone || 'Phone not added'}</span></div>
                <div><BriefcaseBusiness size={16} /><span>{profile.experience || 'Experience not added'}</span></div>
              </div>

              <div className="candidate-progress-block">
                <div className="candidate-progress-header">
                  <span>Completion score</span>
                  <strong>{profileCompletion}%</strong>
                </div>
                <div className="candidate-progress-track">
                  <span style={{ width: `${profileCompletion}%` }} />
                </div>
                <p>Complete every field to look stronger to recruiters and hiring teams.</p>
              </div>
            </article>

            <article className="candidate-sidebar-card">
              <div className="candidate-sidebar-heading">
                <h2>Key skills</h2>
                <span>{skills.length} tagged</span>
              </div>

              {skills.length ? (
                <div className="candidate-skill-cloud">
                  {skills.map((skill) => <span key={skill}>{skill}</span>)}
                </div>
              ) : (
                <div className="candidate-empty-note">
                  Add skill tags to improve matching quality and employer confidence.
                </div>
              )}
            </article>

            <article className="candidate-sidebar-card candidate-guidance-card">
              <div className="candidate-sidebar-heading">
                <h2>Next best moves</h2>
                <Target size={16} />
              </div>

              <ul className="candidate-guidance-list">
                <li>Keep your resume refreshed before you apply to new roles.</li>
                <li>Save promising jobs so you can compare them side by side.</li>
                <li>Watch status changes and follow up on reviewed applications.</li>
              </ul>
            </article>
          </aside>

          <div className="candidate-dashboard-main">
            <section className="candidate-actions-row">
              <Link to="/jobs" className="candidate-action-card">
                <Search size={18} />
                <div>
                  <strong>Find new opportunities</strong>
                  <p>Browse active listings and shortlist your next move.</p>
                </div>
              </Link>

              <Link to="/saved-jobs" className="candidate-action-card">
                <Bookmark size={18} />
                <div>
                  <strong>Saved jobs</strong>
                  <p>Keep track of roles you want to revisit before applying.</p>
                </div>
              </Link>

              <Link to="/applications" className="candidate-action-card">
                <FileText size={18} />
                <div>
                  <strong>Application tracker</strong>
                  <p>Review every submission and monitor recruiter updates.</p>
                </div>
              </Link>
            </section>

            <section className="candidate-main-card resume-card">
              <div className="candidate-main-card-header">
                <div>
                  <span className="candidate-section-tag">Resume readiness</span>
                  <h2>Keep your resume application-ready</h2>
                  <p>Upload the latest version so your profile is ready when the next strong role appears.</p>
                </div>
                <UploadCloud size={18} />
              </div>

              <input
                type="file"
                accept=".pdf,.doc,.docx"
                id="resumeInput"
                onChange={handleFileChange}
                hidden
              />

              <div className="resume-card-actions">
                <label htmlFor="resumeInput" className="candidate-secondary-link">Choose file</label>
                <button
                  type="button"
                  onClick={handleResumeUpload}
                  disabled={!resumeFile || uploading}
                  className="candidate-primary-button"
                >
                  {uploading ? 'Uploading...' : 'Upload resume'}
                </button>
              </div>

              {resumeFile && (
                <div className="resume-file-preview">
                  <div>
                    <strong>{resumeFile.name}</strong>
                    <span>{Math.max(1, Math.round(resumeFile.size / 1024))} KB selected</span>
                  </div>
                  <a href={resumePreviewUrl} download={resumeFile.name}>Preview download</a>
                </div>
              )}

              {uploadMessage && (
                <div className={`candidate-inline-message ${uploadMessage.includes('failed') ? 'error' : 'success'}`}>
                  {uploadMessage}
                </div>
              )}
            </section>

            <section className="candidate-main-card">
              <div className="candidate-main-card-header">
                <div>
                  <span className="candidate-section-tag">Application pulse</span>
                  <h2>Recent application movement</h2>
                  <p>See where each role stands and focus your follow-ups where they matter most.</p>
                </div>
                <Link to="/applications">Open full tracker</Link>
              </div>

              {recentApplications.length === 0 ? (
                <div className="candidate-empty-state">
                  <strong>No applications yet</strong>
                  <p>Start applying to roles and this dashboard will begin tracking your pipeline automatically.</p>
                  <Link to="/jobs" className="candidate-primary-link">
                    Browse jobs
                    <ArrowRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="candidate-application-list">
                  {recentApplications.map((application) => {
                    const statusMeta = getStatusMeta(application.status);

                    return (
                      <article key={application.id} className="candidate-application-item">
                        <div className="candidate-application-main">
                          <div className="candidate-application-title-row">
                            <h3>{application.jobTitle}</h3>
                            <span className={`candidate-status-pill ${statusMeta.className}`}>
                              {statusMeta.icon}
                              {statusMeta.label}
                            </span>
                          </div>
                          <p>{application.jobLocation || 'Location not available'}</p>
                          <small>{application.appliedAt || 'Recently applied'}</small>
                        </div>

                        <div className="candidate-application-note">
                          <strong>Application note</strong>
                          <p>{application.applicationNote || 'No extra note was added to this application.'}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
