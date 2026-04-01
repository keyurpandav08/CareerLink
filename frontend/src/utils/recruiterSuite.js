import { createInitials, parsePossibleDate, parseTagList } from './candidatePortal';

export const RECRUITER_STAGE_META = {
  PENDING: {
    label: 'New Applicants',
    compactLabel: 'New',
    tone: 'pending',
    accent: '#94a3b8'
  },
  REVIEWED: {
    label: 'Reviewed',
    compactLabel: 'Reviewed',
    tone: 'reviewed',
    accent: '#2563eb'
  },
  ACCEPTED: {
    label: 'Offer Made',
    compactLabel: 'Offer',
    tone: 'accepted',
    accent: '#10b981'
  },
  REJECTED: {
    label: 'Closed',
    compactLabel: 'Closed',
    tone: 'rejected',
    accent: '#f97316'
  }
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const normalizeText = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenizeNormalized = (value) =>
  normalizeText(value)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 1);

const getCityBucket = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return 'Unspecified';
  return raw.split(',')[0].trim() || 'Unspecified';
};

const getRelatedJob = (application, jobs) =>
  jobs.find((job) => job.title === application.jobTitle && job.location === application.jobLocation)
  || jobs.find((job) => job.title === application.jobTitle)
  || null;

const getYearValue = (value) => {
  const raw = String(value || '');
  const numbers = raw.match(/\d+(\.\d+)?/g);
  if (!numbers?.length) return null;

  const parsed = numbers.map(Number).filter(Number.isFinite);
  if (!parsed.length) return null;
  return Math.max(...parsed);
};

const getExperienceAlignment = (candidateValue, roleValue) => {
  const candidateYears = getYearValue(candidateValue);
  const roleYears = getYearValue(roleValue);

  if (candidateYears === null || roleYears === null) return null;
  if (candidateYears >= roleYears) return 1;
  if (candidateYears + 1 >= roleYears) return 0.75;
  if (candidateYears + 2 >= roleYears) return 0.55;
  return 0.3;
};

const getLocationAlignment = (candidateLocation, jobLocation) => {
  const normalizedCandidate = normalizeText(candidateLocation);
  const normalizedJob = normalizeText(jobLocation);

  if (!normalizedCandidate || !normalizedJob) return null;
  if (normalizedCandidate.includes('remote') || normalizedJob.includes('remote')) return 1;
  if (normalizedCandidate === normalizedJob) return 1;
  if (normalizedCandidate.includes(normalizedJob) || normalizedJob.includes(normalizedCandidate)) return 0.9;
  if (getCityBucket(normalizedCandidate) === getCityBucket(normalizedJob)) return 0.75;
  return 0.35;
};

const getSkillAlignment = (candidateSkillsValue, jobSkillsValue) => {
  const candidateSkills = parseTagList(candidateSkillsValue).map(normalizeText).filter(Boolean);
  const jobSkills = parseTagList(jobSkillsValue).map(normalizeText).filter(Boolean);

  if (!candidateSkills.length || !jobSkills.length) return null;

  const candidateTokens = new Set(candidateSkills.flatMap(tokenizeNormalized));

  const overlap = jobSkills.filter((jobSkill) =>
    candidateSkills.some((candidateSkill) =>
      candidateSkill === jobSkill
      || candidateSkill.includes(jobSkill)
      || jobSkill.includes(candidateSkill)
      || tokenizeNormalized(jobSkill).every((token) => candidateTokens.has(token))
    )
  ).length;

  return overlap / jobSkills.length;
};

export const getMatchScore = (application, jobs = [], aiMatches = {}) => {
  const aiMatch = aiMatches?.[application?.id];
  if (aiMatch?.matchScore !== undefined && aiMatch?.matchScore !== null) {
    return Number(aiMatch.matchScore);
  }

  const job = getRelatedJob(application, jobs);
  if (!job) return null;

  const weightedParts = [];
  const skillAlignment = getSkillAlignment(application.applicantSkills, job.keySkills);
  const experienceAlignment = getExperienceAlignment(application.applicantExperience, job.experienceLevel);
  const locationAlignment = getLocationAlignment(application.applicantLocation, job.location);

  if (skillAlignment === null) return null;

  weightedParts.push({ weight: 0.85, value: skillAlignment });
  if (experienceAlignment !== null) weightedParts.push({ weight: 0.1, value: experienceAlignment });
  if (locationAlignment !== null) weightedParts.push({ weight: 0.05, value: locationAlignment });

  if (!weightedParts.length) return null;

  const totalWeight = weightedParts.reduce((sum, item) => sum + item.weight, 0);
  const normalizedScore = weightedParts.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight;

  return Math.round(clamp(normalizedScore * 100, 0, 100));
};

export const getRecruiterCompany = (profile, employer = {}) =>
  profile?.companyName?.trim()
  || employer?.company?.trim()
  || profile?.username?.trim()
  || employer?.name?.trim()
  || 'Recruiter Suite';

export const getRecruiterName = (profile, employer = {}) =>
  profile?.fullName?.trim()
  || employer?.name?.trim()
  || 'Recruiter';

export const getRecruiterAvatarLabel = (profile, employer = {}) =>
  createInitials(getRecruiterName(profile, employer));

export const formatCurrency = (value) => {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) return 'Compensation not listed';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(numericValue);
};

export const formatCompactNumber = (value) =>
  new Intl.NumberFormat('en-US', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1000 ? 1 : 0
  }).format(Number(value) || 0);

export const formatPercent = (value) => `${Math.round(Number(value) || 0)}%`;

export const getApplicationDate = (application) => parsePossibleDate(application?.appliedAt);

export const countApplicationsInRange = (applications, startDate, endDate) =>
  applications.filter((application) => {
    const appliedAt = getApplicationDate(application);
    if (!appliedAt) return false;
    return appliedAt >= startDate && appliedAt <= endDate;
  }).length;

export const buildDailySeries = (applications, days = 7) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return Array.from({ length: days }, (_, index) => {
    const cursor = new Date(end);
    cursor.setDate(end.getDate() - (days - index - 1));
    cursor.setHours(0, 0, 0, 0);

    const next = new Date(cursor);
    next.setHours(23, 59, 59, 999);

    const count = countApplicationsInRange(applications, cursor, next);

    return {
      label: cursor.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
      count
    };
  });
};

export const buildWeeklySeries = (applications, weeks = 4) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return Array.from({ length: weeks }, (_, index) => {
    const rangeEnd = new Date(end);
    rangeEnd.setDate(end.getDate() - ((weeks - index - 1) * 7));

    const rangeStart = new Date(rangeEnd);
    rangeStart.setDate(rangeEnd.getDate() - 6);
    rangeStart.setHours(0, 0, 0, 0);

    const count = countApplicationsInRange(applications, rangeStart, rangeEnd);

    return {
      label: `Week ${index + 1}`,
      count
    };
  });
};

export const buildDistribution = (items, selector, limit = 3) => {
  const counts = items.reduce((accumulator, item) => {
    const key = selector(item);
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
};

export const buildLocationDistribution = (applications) =>
  buildDistribution(applications, (application) => getCityBucket(application.applicantLocation), 3);

export const buildJobTypeDistribution = (jobs) =>
  buildDistribution(jobs, (job) => job.jobType || 'Unspecified', 5);

export const getStatusCount = (applications, status) =>
  applications.filter((application) => application.status === status).length;

export const sortApplicationsByMatch = (applications, jobs, aiMatches = {}) =>
  [...applications].sort((left, right) => {
    const rightScore = getMatchScore(right, jobs, aiMatches) ?? -1;
    const leftScore = getMatchScore(left, jobs, aiMatches) ?? -1;
    if (rightScore !== leftScore) return rightScore - leftScore;

    const rightDate = getApplicationDate(right)?.getTime() || 0;
    const leftDate = getApplicationDate(left)?.getTime() || 0;
    return rightDate - leftDate;
  });

export const buildInsight = (jobs, applications) => {
  const now = new Date();
  const currentStart = new Date(now);
  currentStart.setDate(now.getDate() - 13);
  currentStart.setHours(0, 0, 0, 0);

  const previousEnd = new Date(currentStart);
  previousEnd.setDate(currentStart.getDate() - 1);
  previousEnd.setHours(23, 59, 59, 999);

  const previousStart = new Date(previousEnd);
  previousStart.setDate(previousEnd.getDate() - 13);
  previousStart.setHours(0, 0, 0, 0);

  const currentVolume = countApplicationsInRange(applications, currentStart, now);
  const previousVolume = countApplicationsInRange(applications, previousStart, previousEnd);
  const acceptedCount = getStatusCount(applications, 'ACCEPTED');
  const reviewedCount = getStatusCount(applications, 'REVIEWED');
  const openJobs = jobs.filter((job) => String(job.status).toLowerCase() === 'open').length;

  if (currentVolume > previousVolume && previousVolume > 0) {
    const uplift = Math.round(((currentVolume - previousVolume) / previousVolume) * 100);
    return {
      eyebrow: 'Momentum',
      title: `Applications are up ${uplift}% over the previous two-week window.`,
      body: `Keep your ${openJobs || jobs.length || 1} active roles refreshed while demand is trending upward.`
    };
  }

  if (acceptedCount > 0) {
    const acceptedRate = applications.length ? Math.round((acceptedCount / applications.length) * 100) : 0;
    return {
      eyebrow: 'Offer Signal',
      title: `${acceptedRate}% of tracked applicants have already reached a positive decision.`,
      body: reviewedCount
        ? `${reviewedCount} more candidates are currently in recruiter review and may be ready for the next action.`
        : 'Review new applicants quickly to keep the acceptance pipeline healthy.'
    };
  }

  return {
    eyebrow: 'Queue Health',
    title: `${getStatusCount(applications, 'PENDING')} candidates are waiting for their first recruiter decision.`,
    body: applications.length
      ? 'Moving the oldest pending profiles first will keep pipeline age under control.'
      : 'New applicants will surface here as soon as your first role starts receiving interest.'
  };
};

export const buildPipelineRows = (applications) => {
  const total = applications.length || 1;

  return Object.entries(RECRUITER_STAGE_META).map(([status, meta]) => {
    const matches = applications.filter((application) => application.status === status);
    const averageAge = matches.length
      ? (matches.reduce((sum, application) => {
        const appliedAt = getApplicationDate(application);
        if (!appliedAt) return sum;
        return sum + Math.max(0, (Date.now() - appliedAt.getTime()) / 86400000);
      }, 0) / matches.length)
      : 0;

    return {
      status,
      label: meta.label,
      activeCandidates: matches.length,
      averageAgeDays: Number(averageAge.toFixed(1)),
      share: Math.round((matches.length / total) * 100)
    };
  });
};

export const getDeltaSummary = (currentValue, previousValue, suffix = '%') => {
  if (!previousValue && !currentValue) return { label: 'Stable', tone: 'neutral' };
  if (!previousValue && currentValue) return { label: `+${currentValue}${suffix === '%' ? '' : suffix}`, tone: 'positive' };

  const delta = ((currentValue - previousValue) / previousValue) * 100;
  if (!Number.isFinite(delta) || Math.abs(delta) < 1) {
    return { label: 'Stable', tone: 'neutral' };
  }

  const rounded = Math.round(Math.abs(delta));
  return {
    label: `${delta >= 0 ? '+' : '-'}${rounded}${suffix}`,
    tone: delta >= 0 ? 'positive' : 'negative'
  };
};
