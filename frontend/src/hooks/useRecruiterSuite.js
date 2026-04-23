import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getFriendlyAiError } from '../utils/aiError';
import { readCachedValue, writeCachedValue } from '../utils/pageCache';

const emptyAiInsights = {
  headline: '',
  summary: '',
  matches: [],
  error: ''
};

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

    const cacheKey = `recruiter-workspace:${user.username}`;
    const cachedState = readCachedValue(cacheKey, null);
    const hasCachedState = Boolean(cachedState?.profile || cachedState?.dashboard);

    if (hasCachedState) {
      setProfile(cachedState.profile || null);
      setDashboard(cachedState.dashboard || null);
      setError('');
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const [profileRes, dashboardRes] = await Promise.all([
        api.get(`/users/username/${user.username}`),
        api.get('/employer/dashboard')
      ]);

      const nextDashboard = {
        ...dashboardRes.data,
        aiInsights: cachedState?.dashboard?.aiInsights || emptyAiInsights
      };

      setProfile(profileRes.data);
      setDashboard(nextDashboard);
      setError('');
      setLoading(false);
      writeCachedValue(cacheKey, {
        profile: profileRes.data,
        dashboard: nextDashboard
      });

      api.get(`/api/ai/recruiter/${profileRes.data.id}/applications`, {
        timeout: 8000
      })
        .then((aiRes) => {
          const nextAiInsights = { ...aiRes.data, error: '' };
          setDashboard((currentDashboard) => {
            const mergedDashboard = {
              ...(currentDashboard || dashboardRes.data),
              aiInsights: nextAiInsights
            };

            writeCachedValue(cacheKey, {
              profile: profileRes.data,
              dashboard: mergedDashboard
            });

            return mergedDashboard;
          });
        })
        .catch((aiError) => {
          const nextSummary = getFriendlyAiError(
            aiError,
            'Add your Gemini key in application.properties to enable live recruiter scoring.'
          );
          const nextAiInsights = {
            headline: 'AI match insights are waiting for configuration.',
            summary: nextSummary,
            matches: [],
            error: nextSummary
          };

          setDashboard((currentDashboard) => {
            const mergedDashboard = {
              ...(currentDashboard || dashboardRes.data),
              aiInsights: nextAiInsights
            };

            writeCachedValue(cacheKey, {
              profile: profileRes.data,
              dashboard: mergedDashboard
            });

            return mergedDashboard;
          });
        });
    } catch (requestError) {
      if (!hasCachedState) {
        setError(requestError.response?.data?.error || 'Failed to load recruiter workspace.');
      }
    } finally {
      if (!hasCachedState) {
        setLoading(false);
      }
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
    aiInsights: dashboard?.aiInsights || { headline: '', summary: '', matches: [], error: '' },
    loading,
    error,
    refresh: loadWorkspace
  };
};
