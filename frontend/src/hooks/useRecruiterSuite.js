import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export const useRecruiterSuite = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadWorkspace = useCallback(async () => {
    if (!user?.username) {
      setProfile(null);
      setDashboard(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [profileRes, dashboardRes] = await Promise.all([
        api.get(`/users/username/${user.username}`),
        api.get('/employer/dashboard')
      ]);

      setProfile(profileRes.data);
      setDashboard(dashboardRes.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to load recruiter workspace.');
    } finally {
      setLoading(false);
    }
  }, [user?.username]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  return {
    profile,
    employer: dashboard?.employer || null,
    jobs: Array.isArray(dashboard?.jobs) ? dashboard.jobs : [],
    applications: Array.isArray(dashboard?.applications) ? dashboard.applications : [],
    loading,
    error,
    refresh: loadWorkspace
  };
};
