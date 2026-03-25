import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  CheckCircle2,
  Clock3,
  FileUp,
  Mail,
  Phone,
  UserRound,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Dashboard.css';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
const [fileURL, setFileURL] = useState("");
useEffect(() => {
  applications.forEach(app => {

    const key = `status_${app.id}`;
    const oldStatus = localStorage.getItem(key);

    if (app.status === "ACCEPTED" && oldStatus !== "ACCEPTED") {
      toast.success("🎉 Congratulations! You are hired!");
      localStorage.setItem(key, "ACCEPTED");
    }

    if (app.status === "REJECTED" && oldStatus !== "REJECTED") {
      toast.error("❌ Sorry, you are not selected.");
      localStorage.setItem(key, "REJECTED");
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
      } catch (requestError) {
        setError('Failed to load dashboard.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) loadData();
  }, [user]);

  const applicationStats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((item) => item.status === 'PENDING').length;
    const accepted = applications.filter((item) => item.status === 'ACCEPTED').length;
    const rejected = applications.filter((item) => item.status === 'REJECTED').length;
    return { total, pending, accepted, rejected };
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
    } catch (parsingError) {
      return 0;
    }
  }, []);

 const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setResumeFile(file);

      // create download link
      const url = URL.createObjectURL(file);
      setFileURL(url);
    }
  };
  const handleResumeUpload = async () => {
    if (!resumeFile || !profile?.id) return;

    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('userId', profile.id);

    try {
      setUploading(true);
      setUploadMessage('');
      await api.post('/users/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResumeFile(null);
      setUploadMessage('Resume uploaded Sucessfully');
    } catch (requestError) {
      setUploadMessage('Resume upload failed.');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="candidate-dash-wrap">Loading dashboard...</div>;
  }

  if (!profile) {
    return <div className="candidate-dash-wrap">{error || 'Profile not found.'}</div>;
  }

  return (
    <section className="candidate-dash-wrap">
        <ToastContainer position="top-right" autoClose={3000} />
      <div className="container candidate-dash-grid">
        <article className="dash-profile-card">
          <h1>Candidate Dashboard</h1>
          <p>Welcome back, {profile.fullName}</p>

          <div className="profile-row"><UserRound size={16} />{profile.fullName}</div>
          <div className="profile-row"><Mail size={16} />{profile.email}</div>
          <div className="profile-row"><Phone size={16} />{profile.phone || 'Not set'}</div>
          <div className="profile-row"><Briefcase size={16} />{profile.experience || 'Not set'}</div>

          <div className="profile-skills-block">
            <h3>Key Skills</h3>
            {profile.skills ? (
              <div className="chip-list">
                {profile.skills.split(',').map((skill) => (
                  <span key={skill.trim()}>{skill.trim()}</span>
                ))}
              </div>
            ) : (
              <p>Add skills to improve matching.</p>
            )}
          </div>

          <div className="completion-wrap">
            <div className="completion-head">
              <span>Profile completion</span>
              <strong>{profileCompletion}%</strong>
            </div>
            <div className="completion-track">
              <span style={{ width: `${profileCompletion}%` }} />
            </div>
            <Link to="/edit-profile" className="inline-link">Complete profile</Link>
          </div>
        </article>

        <article className="dash-main-card">
          <div className="stat-grid">
            <div className="stat-box">
              <small>Total Applications</small>
              <strong>{applicationStats.total}</strong>
            </div>
            <div className="stat-box">
              <small>Pending</small>
              <strong>{applicationStats.pending}</strong>
            </div>
            <div className="stat-box">
              <small>Accepted</small>
              <strong>{applicationStats.accepted}</strong>
            </div>
            <div className="stat-box">
              <small>Saved Jobs</small>
              <strong>{savedJobsCount}</strong>
            </div>
          </div>

          <div className="resume-upload-card">
                <h2>Resume Upload</h2>
                <p>Upload latest resume before applying to improve shortlist chances.</p>

                {/* Hidden Input */}
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  id="resumeInput"
                  onChange={handleFileChange}
                  hidden
                />

                {/* Buttons Section (VERTICAL) */}
                <div className="upload-section">
                  {/* Choose Resume */}
                  <label htmlFor="resumeInput" className="custom-upload">
                    📄 Choose Resume
                  </label>

                  {/* Upload Resume BELOW */}
                  <button
                    type="button"
                    onClick={handleResumeUpload}
                    disabled={!resumeFile || uploading}
                    className="upload-btn"
                  >
                    <FileUp size={15} />
                    {uploading ? "Uploading..." : "Upload Resume"}
                  </button>
                </div>

                {/* File Info */}
                {resumeFile && (
                  <div className="file-info">
                    <span>📄 {resumeFile.name}</span>

                    <a href={fileURL} download className="download-btn">
                      ⬇ Download
                    </a>
                  </div>
                )}

                {/* Success Message */}
                {uploadMessage && (
                  <div className="upload-success">
                    {uploadMessage}
                  </div>
                )}
              </div>

          <div className="applications-table-card">
            <div className="applications-title-row">
              <h2>Recent Applications</h2>
              <Link to="/applications">View all</Link>
            </div>

            {applications.length === 0 ? (
              <div className="empty-panel">
                <p>No applications yet.</p>
                <Link to="/jobs">Browse jobs</Link>
              </div>
            ) : (
              <div className="simple-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Job</th>
                      <th>Applied</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.slice(0, 6).map((app) => (
                      <tr key={app.id}>
                        <td>{app.jobTitle}</td>
                        <td>{app.appliedAt || '-'}</td>
                        <td>
                          <span className={`status-pill ${String(app.status).toLowerCase()}`}>
                            {app.status === 'ACCEPTED' && <CheckCircle2 size={13} />}
                            {app.status === 'PENDING' && <Clock3 size={13} />}
                            {app.status === 'REJECTED' && <XCircle size={13} />}
                            {app.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </article>
      </div>
    </section>
  );
};

export default Dashboard;
