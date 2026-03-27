import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  LayoutDashboard,
  Menu,
  Search,
  Settings,
  Sparkles,
  UserRound,
  X,
  XCircle
} from 'lucide-react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Dashboard.css';
import { getProfilePhoto } from '../utils/candidatePortal';

const RESUME_PLACEHOLDER = 'resume_not_uploaded';

const SIDEBAR_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, active: true },
  { to: '/profile', label: 'Profile', icon: UserRound },
  { to: '/applications', label: 'My Applications', icon: FileText },
  { to: '/resume-builder', label: 'AI Resume Insights', icon: Sparkles },
  { to: '/settings', label: 'Settings', icon: Settings }
];

const RECOMMENDATION_TEMPLATES = [
  {
    id: 'fallback-frontend',
    title: 'Senior Frontend Engineer',
    employerName: 'Stellar Cloud Systems',
    location: 'Remote',
    salary: '$140k - $180k',
    tags: ['React', 'TypeScript', 'Tailwind']
  },
  {
    id: 'fallback-designer',
    title: 'Product UI Designer',
    employerName: 'Linearity HQ',
    location: 'San Francisco, CA',
    salary: '$120k - $160k',
    tags: ['Figma', 'Design Ops', 'Research']
  },
  {
    id: 'fallback-fullstack',
    title: 'Full Stack Developer',
    employerName: 'Velocity AI',
    location: 'Austin, TX',
    salary: '$150k - $200k',
    tags: ['Node.js', 'Next.js', 'APIs'],
    featured: true
  },
  {
    id: 'fallback-data',
    title: 'Platform Engineer',
    employerName: 'Northstar Compute',
    location: 'Bengaluru, India',
    salary: 'INR 24 - 36 LPA',
    tags: ['Java', 'Spring', 'AWS']
  }
];

const PROFILE_FIELDS = [
  'fullName',
  'email',
  'phone',
  'location',
  'skills',
  'experience',
  'graduation',
  'profileSummary',
  'projects',
  'certifications',
  'resumeUrl'
];

const parseSkills = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hasResume = (value) => Boolean(value) && value !== RESUME_PLACEHOLDER;

const createInitials = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JL';

const getFirstName = (value = '') => value.split(' ').filter(Boolean)[0] || 'there';

const parsePossibleDate = (value) => {
  if (!value) return null;

  if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
    const [datePart, timePart = '00:00'] = value.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    const parsed = new Date(year, month - 1, day, hours || 0, minutes || 0);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatRelativeDate = (value) => {
  const parsed = parsePossibleDate(value);
  if (!parsed) return value || 'Recently updated';

  const diffDays = Math.floor((Date.now() - parsed.getTime()) / 86400000);
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return parsed.toLocaleDateString();
};

const getStatusMeta = (status) => {
  switch (status) {
    case 'ACCEPTED':
      return {
        label: 'Offered',
        className: 'accepted',
        icon: <CheckCircle2 size={14} />
      };
    case 'REJECTED':
      return {
        label: 'Closed',
        className: 'rejected',
        icon: <XCircle size={14} />
      };
    case 'REVIEWED':
      return {
        label: 'Reviewing',
        className: 'reviewed',
        icon: <Sparkles size={14} />
      };
    default:
      return {
        label: 'Pending',
        className: 'pending',
        icon: <Clock3 size={14} />
      };
  }
};

const loadSavedJobs = () => {
  try {
    const stored = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const formatSalary = (salary) => {
  if (salary === null || salary === undefined || salary === '') return 'Compensation not shared';
  if (typeof salary === 'string' && /[A-Za-z$]/.test(salary)) return salary;

  const numericSalary = Number(salary);
  if (!Number.isFinite(numericSalary)) return String(salary);
  if (numericSalary >= 100000) return `INR ${(numericSalary / 100000).toFixed(1).replace('.0', '')} LPA`;
  return `INR ${numericSalary}`;
};

const getRecommendationMatch = (job, skills, hasExperience) => {
  const haystack = normalizeText([
    job.title,
    job.employerName,
    job.location,
    job.description,
    ...(job.tags || [])
  ].join(' '));

  const overlap = skills.filter((skill) => haystack.includes(normalizeText(skill))).length;
  const baseScore = job.featured ? 86 : 80;
  return clamp(baseScore + overlap * 5 + (hasExperience ? 3 : 0), 78, 97);
};

const createRecommendation = (job, skills, hasExperience) => {
  const tags = job.tags?.length ? job.tags : skills.slice(0, 3);
  const matchScore = getRecommendationMatch({ ...job, tags }, skills, hasExperience);

  return {
    id: job.id || job.title,
    title: job.title,
    company: job.employerName || 'Confidential employer',
    companyBadge: createInitials(job.employerName || job.title),
    location: job.location || 'Location not shared',
    salary: formatSalary(job.salary),
    tags: tags.length ? tags.slice(0, 3) : ['Growth', 'Team', 'Hiring'],
    matchScore,
    featured: Boolean(job.featured) || matchScore >= 92,
    detailPath: job.id ? `/jobs/${job.id}` : '/jobs'
  };
};

const getInsightItems = (profile, profileCompletion, skills, applications) => {
  const insightScore = clamp(
    Math.round(
      profileCompletion * 0.62 +
        Math.min(skills.length, 6) * 4 +
        (hasResume(profile?.resumeUrl) ? 12 : 0) +
        (profile?.profileSummary ? 6 : 0) +
        (profile?.projects ? 6 : 0) +
        (applications.length ? 4 : 0)
    ),
    48,
    96
  );

  const positives = [];
  const improvements = [];

  if (skills.length >= 3) {
    positives.push(`Strong keyword coverage across ${skills.slice(0, 3).join(', ')}.`);
  } else if (profile?.profileSummary) {
    positives.push('Your profile summary already gives recruiters useful context.');
  } else {
    positives.push('You already have a live candidate profile in the platform.');
  }

  if (!hasResume(profile?.resumeUrl)) {
    improvements.push('Upload your latest resume so every application stays one-click ready.');
  } else if (!profile?.projects) {
    improvements.push('Add project highlights to improve technical credibility with hiring teams.');
  } else if (!profile?.certifications) {
    improvements.push('Certifications can strengthen niche or tool-specific role matching.');
  } else {
    improvements.push('Refresh role-specific keywords as you target more specialized openings.');
  }

  return {
    score: insightScore,
    items: [
      { tone: 'positive', text: positives[0] },
      { tone: 'warning', text: improvements[0] }
    ]
  };
};

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const profilePhoto = getProfilePhoto(user);

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
        setError('');
        const profileRes = await api.get(`/users/username/${user.username}`);
        const currentProfile = profileRes.data;
        setProfile(currentProfile);

        const applicationsRes = await api.get(`/applications/user/${currentProfile.id}`);
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

  const savedJobs = useMemo(() => loadSavedJobs(), []);

  const skills = useMemo(() => parseSkills(profile?.skills), [profile?.skills]);

  const profileCompletion = useMemo(() => {
    if (!profile) return 0;

    const completedFields = PROFILE_FIELDS.filter((field) => {
      if (field === 'resumeUrl') return hasResume(profile.resumeUrl);
      return Boolean(profile[field]);
    }).length;

    return Math.round((completedFields / PROFILE_FIELDS.length) * 100);
  }, [profile]);

  const applicationStats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((item) => item.status === 'PENDING').length;
    const reviewed = applications.filter((item) => item.status === 'REVIEWED').length;
    const accepted = applications.filter((item) => item.status === 'ACCEPTED').length;

    return { total, pending, reviewed, accepted };
  }, [applications]);

  const recommendedJobs = useMemo(() => {
    const savedJobRecommendations = savedJobs.slice(0, 3).map((job) => ({
      ...job,
      tags: parseSkills(job.skills || '').length ? parseSkills(job.skills) : skills.slice(0, 3)
    }));

    const fallbackRecommendations = RECOMMENDATION_TEMPLATES.filter(
      (template) => !savedJobRecommendations.some((savedJob) => savedJob.title === template.title)
    );

    return [...savedJobRecommendations, ...fallbackRecommendations]
      .slice(0, 3)
      .map((job) => createRecommendation(job, skills, profile?.experience && profile.experience !== 'Fresher'));
  }, [profile?.experience, savedJobs, skills]);

  const recentApplications = useMemo(() => {
    const list = [...applications];

    list.sort((left, right) => {
      const leftDate = parsePossibleDate(left.appliedAt)?.getTime() || 0;
      const rightDate = parsePossibleDate(right.appliedAt)?.getTime() || 0;
      return rightDate - leftDate;
    });

    return list.slice(0, 5);
  }, [applications]);

  const resumeInsight = useMemo(
    () => getInsightItems(profile, profileCompletion, skills, applications),
    [applications, profile, profileCompletion, skills]
  );

  const welcomeNudge = useMemo(() => {
    if (!profile) return '';
    if (!profile.projects) {
      return 'Adding project highlights can improve recruiter confidence for technical roles.';
    }
    if (!profile.profileSummary) {
      return 'A sharper profile summary helps recruiters understand your strengths faster.';
    }
    if (!hasResume(profile.resumeUrl)) {
      return 'Upload your latest resume to keep every new application friction-free.';
    }
    return 'Your profile is in strong shape. Keep applications moving and refresh it for each target role.';
  }, [profile]);

  const filteredRecommendations = useMemo(() => {
    if (!searchTerm.trim()) return recommendedJobs;
    const query = normalizeText(searchTerm);

    return recommendedJobs.filter((job) =>
      normalizeText([job.title, job.company, job.location, ...(job.tags || [])].join(' ')).includes(query)
    );
  }, [recommendedJobs, searchTerm]);

  const filteredApplications = useMemo(() => {
    if (!searchTerm.trim()) return recentApplications;
    const query = normalizeText(searchTerm);

    return recentApplications.filter((application) =>
      normalizeText([
        application.jobTitle,
        application.jobLocation,
        application.applicationNote,
        application.status
      ].join(' ')).includes(query)
    );
  }, [recentApplications, searchTerm]);

  if (loading) {
    return (
      <section className="candidate-portal candidate-portal--status">
        <div className="candidate-status-card">Loading dashboard...</div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="candidate-portal candidate-portal--status">
        <div className="candidate-status-card">{error || 'Profile not found.'}</div>
      </section>
    );
  }

  const firstName = getFirstName(profile.fullName || user?.fullName || user?.username);
  return (
    <section className="candidate-portal">
      <ToastContainer position="top-right" autoClose={3000} />

      <button
        type="button"
        className={`candidate-sidebar-backdrop ${sidebarOpen ? 'is-visible' : ''}`}
        aria-label="Close sidebar"
        onClick={() => setSidebarOpen(false)}
      />

      <div className="candidate-portal-shell">
        <aside className={`candidate-sidebar ${sidebarOpen ? 'is-open' : ''}`}>
          <div className="candidate-sidebar-head">
            <div>
              <div className="candidate-sidebar-brand">Candidate Portal</div>
              <p>Manage your career</p>
            </div>

            <button
              type="button"
              className="candidate-sidebar-close"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <nav className="candidate-sidebar-nav">
            {SIDEBAR_LINKS.map((item) => {
              const SidebarIcon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`candidate-sidebar-link ${item.active ? 'is-active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <SidebarIcon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="candidate-pro-plan">
            <span>Pro Plan</span>
            <p>Get unlimited AI resume critiques and priority job matching.</p>
            <Link to="/pricing" className="candidate-pro-plan-btn">Upgrade Now</Link>
          </div>
        </aside>

        <main className="candidate-main">
          <header className="candidate-topbar">
            <div className="candidate-topbar-left">
              <button
                type="button"
                className="candidate-sidebar-toggle"
                aria-label="Open sidebar"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} />
              </button>

              <div className="candidate-product-name">Job Lithic</div>

              <label className="candidate-searchbar" htmlFor="candidateDashboardSearch">
                <Search size={16} />
                <input
                  id="candidateDashboardSearch"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search jobs, insights, or applications..."
                />
              </label>
            </div>

            <div className="candidate-topbar-actions">
              <Link to="/profile" className="candidate-avatar-button">
                <div className="candidate-avatar-badge">
                  {profilePhoto
                    ? <img src={profilePhoto} alt={firstName} />
                    : createInitials(profile.fullName || user?.username)}
                </div>
              </Link>
            </div>
          </header>

          <div className="candidate-content">
            <section className="candidate-hero-grid">
              <article className="candidate-welcome-card">
                <div className="candidate-welcome-copy">
                  <h1>Welcome back, {firstName}!</h1>
                  <p>
                    Your profile is {profileCompletion}% complete. {welcomeNudge}
                  </p>
                </div>

                <div className="candidate-progress-card">
                  <div className="candidate-progress-track">
                    <span style={{ width: `${profileCompletion}%` }} />
                  </div>

                  <div className="candidate-progress-labels">
                    <span>Progress</span>
                    <strong>{profileCompletion}% Complete</strong>
                  </div>
                </div>

                <div className="candidate-hero-stats">
                  <div>
                    <small>Saved jobs</small>
                    <strong>{savedJobs.length}</strong>
                  </div>
                  <div>
                    <small>Applications</small>
                    <strong>{applicationStats.total}</strong>
                  </div>
                  <div>
                    <small>Offers</small>
                    <strong>{applicationStats.accepted}</strong>
                  </div>
                </div>

                <div className="candidate-hero-actions">
                  <Link to="/edit-profile" className="candidate-hero-primary">
                    Complete profile
                    <ArrowRight size={15} />
                  </Link>
                  <Link to="/jobs" className="candidate-hero-secondary">Explore roles</Link>
                </div>
              </article>

              <article className="candidate-insight-card">
                <div className="candidate-insight-head">
                  <div className="candidate-insight-kicker">
                    <Sparkles size={16} />
                    <span>AI Resume Insights</span>
                  </div>
                </div>

                <div className="candidate-insight-score">
                  <strong>{resumeInsight.score}</strong>
                  <span>/100 Score</span>
                </div>

                <ul className="candidate-insight-list">
                  {resumeInsight.items.map((item) => (
                    <li key={item.text} className={item.tone}>
                      <span className="candidate-insight-dot" />
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/resume-builder" className="candidate-insight-btn">Boost Score</Link>
              </article>
            </section>

            <section className="candidate-section">
              <div className="candidate-section-head">
                <div>
                  <h2>Recommended for You</h2>
                  <p>AI-powered matches based on your profile, saved roles, and recent activity.</p>
                </div>
                <Link to="/jobs" className="candidate-section-link">View All Matches</Link>
              </div>

              {filteredRecommendations.length === 0 ? (
                <div className="candidate-empty-state">
                  <strong>No matches found for that search yet.</strong>
                  <p>Try a broader search term to see recommended roles and recent activity together.</p>
                </div>
              ) : (
                <div className="candidate-recommendations-row">
                  {filteredRecommendations.map((job) => (
                    <article
                      key={job.id}
                      className={`candidate-job-card ${job.featured ? 'is-featured' : ''}`}
                    >
                      <div className="candidate-job-card-top">
                        <div className="candidate-job-logo">{job.companyBadge}</div>
                        <span className={`candidate-job-badge ${job.featured ? 'is-featured' : ''}`}>
                          {job.featured ? 'Featured Match' : `${job.matchScore}% Match`}
                        </span>
                      </div>

                      <div className="candidate-job-copy">
                        <h3>{job.title}</h3>
                        <p>{job.company} - {job.location}</p>
                      </div>

                      <div className="candidate-job-tags">
                        {job.tags.map((tag) => <span key={tag}>{tag}</span>)}
                      </div>

                      <div className="candidate-job-footer">
                        <strong>{job.salary}</strong>
                        <Link to={job.detailPath}>Details</Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="candidate-applications-panel">
              <div className="candidate-section-head candidate-section-head--table">
                <div>
                  <h2>Recent Applications</h2>
                  <p>
                    {applicationStats.total
                      ? `${applicationStats.reviewed} in review, ${applicationStats.pending} pending, ${applicationStats.accepted} offers won.`
                      : 'Your latest application activity will appear here.'}
                  </p>
                </div>

                <div className="candidate-panel-actions">
                  <Link to="/applications" className="candidate-inline-link">View all</Link>
                </div>
              </div>

              {hasResume(profile.resumeUrl) && (
                <div className="candidate-resume-strip">
                  <div className="candidate-resume-strip-copy">
                    <strong>{profile.resumeFileName || 'Uploaded profile resume'}</strong>
                    <span>Your latest resume is attached to your candidate profile.</span>
                  </div>

                  <div className="candidate-resume-strip-actions">
                    <a href={profile.resumeUrl} target="_blank" rel="noreferrer">
                      Open current resume
                    </a>
                  </div>
                </div>
              )}

              {filteredApplications.length === 0 ? (
                <div className="candidate-empty-state candidate-empty-state--table">
                  <strong>{applications.length ? 'No recent applications match your search.' : 'No applications yet.'}</strong>
                  <p>
                    {applications.length
                      ? 'Try a different search term to bring matching jobs or statuses back into view.'
                      : 'Start applying to roles and this dashboard will track your pipeline automatically.'}
                  </p>
                  {!applications.length && (
                    <Link to="/jobs" className="candidate-hero-primary">
                      Browse jobs
                      <ArrowRight size={15} />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="candidate-table-wrap">
                  <table className="candidate-applications-table">
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Location</th>
                        <th>Status</th>
                        <th className="is-right">Last Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplications.map((application) => {
                        const statusMeta = getStatusMeta(application.status);

                        return (
                          <tr key={application.id}>
                            <td>
                              <div className="candidate-table-role">
                                <strong>{application.jobTitle}</strong>
                                <span>{application.applicationNote || 'No application note added.'}</span>
                              </div>
                            </td>
                            <td>{application.jobLocation || 'Location not shared'}</td>
                            <td>
                              <span className={`candidate-status-pill ${statusMeta.className}`}>
                                {statusMeta.icon}
                                {statusMeta.label}
                              </span>
                            </td>
                            <td className="is-right">{formatRelativeDate(application.appliedAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <footer className="candidate-dashboard-footer">
              <div className="candidate-footer-brand">Job Lithic</div>

              <div className="candidate-footer-links">
                <Link to="/terms">Terms</Link>
                <Link to="/privacy-policy">Privacy</Link>
                <Link to="/pricing">Pricing</Link>
                <Link to="/contact">Contact</Link>
              </div>

              <p>{`© ${new Date().getFullYear()} Job Lithic. Architectural career curation.`}</p>
            </footer>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Dashboard;
