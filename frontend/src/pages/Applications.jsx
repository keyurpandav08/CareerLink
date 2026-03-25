import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getRoleName } from '../utils/role';
import api from '../services/api';
import './Applications.css';

const Applications = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadApplications = async () => {
      try {
        setLoading(true);
        const userRes = await api.get(`/users/username/${user.username}`);
        const currentProfile = userRes.data;
        setProfile(currentProfile);

        const isEmployer = currentProfile.roleName === 'EMPLOYER';
        const endpoint = isEmployer
          ? `/applications/employer/${currentProfile.id}`
          : `/applications/user/${currentProfile.id}`;

        const appsRes = await api.get(endpoint);
        setApplications(Array.isArray(appsRes.data) ? appsRes.data : []);
      } catch (requestError) {
        setError('Failed to load applications.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.username) {
      loadApplications();
    }
  }, [user]);

  const statusCount = useMemo(() => ({
    pending: applications.filter((item) => item.status === 'PENDING').length,
    reviewed: applications.filter((item) => item.status === 'REVIEWED').length,
    accepted: applications.filter((item) => item.status === 'ACCEPTED').length,
    rejected: applications.filter((item) => item.status === 'REJECTED').length
  }), [applications]);

  if (loading) {
    return <section className="applications-wrap">Loading applications...</section>;
  }

  if (!profile) {
    return <section className="applications-wrap">{error || 'Profile not available.'}</section>;
  }

  const isEmployer = getRoleName(profile) === 'EMPLOYER';

  return (
    <section className="applications-wrap">
      <div className="container applications-shell">
        <header className="applications-header">
          <div>
            <h1>{isEmployer ? 'Applicant Pipeline' : 'My Applications'}</h1>
            <p>
              {isEmployer
                ? 'Track all candidates who applied to your job listings.'
                : 'Review every application and current status in one place.'}
            </p>
          </div>
          <Link to={isEmployer ? '/employer-dashboard' : '/dashboard'}>Back to dashboard</Link>
        </header>

        <section className="applications-stats">
          <article><small>Pending</small><strong>{statusCount.pending}</strong></article>
          <article><small>Reviewed</small><strong>{statusCount.reviewed}</strong></article>
          <article><small>Accepted</small><strong>{statusCount.accepted}</strong></article>
          <article><small>Rejected</small><strong>{statusCount.rejected}</strong></article>
        </section>

        {applications.length === 0 ? (
          <div className="applications-empty">
            <p>{isEmployer ? 'No candidates applied yet.' : 'You have not applied to any job yet.'}</p>
            {!isEmployer && <Link to="/jobs">Start applying</Link>}
          </div>
        ) : (
          <div className="applications-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{isEmployer ? 'Candidate' : 'Job Role'}</th>
                  <th>{isEmployer ? 'Applied Job' : 'Applied On'}</th>
                  <th>{isEmployer ? 'Applied On' : 'Status'}</th>
                  <th>{isEmployer ? 'Status' : 'Application Note'}</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>{isEmployer ? app.applicantName : app.jobTitle}</td>
                    <td>{isEmployer ? app.jobTitle : app.appliedAt || '-'}</td>
                    <td>{isEmployer ? app.appliedAt || '-' : <span className={`app-status ${String(app.status).toLowerCase()}`}>{app.status}</span>}</td>
                    <td>{isEmployer ? <span className={`app-status ${String(app.status).toLowerCase()}`}>{app.status}</span> : app.applicationNote || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default Applications;
