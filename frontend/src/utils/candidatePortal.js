export const RESUME_PLACEHOLDER = 'resume_not_uploaded';
const PROFILE_META_STORAGE_KEY = 'joblithic_candidate_profile_meta';

export const parseTagList = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();

export const titleCaseFromSlug = (value = '') =>
  value
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(capitalize)
    .join(' ') || 'Candidate';

export const createInitials = (value = '') =>
  value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'JL';

export const getDisplayName = (profile, user) => {
  const source = profile?.fullName || user?.fullName || user?.username || 'Candidate';
  return source.includes(' ') ? source : titleCaseFromSlug(source);
};

export const hasResume = (value) => Boolean(value) && value !== RESUME_PLACEHOLDER;

export const getCandidateHeadline = (profile) => {
  const skills = parseTagList(profile?.skills).slice(0, 2);
  const experience = String(profile?.experience || '').trim();

  if (experience && experience !== 'Fresher' && skills.length) {
    return `${experience} • ${skills.join(' / ')}`;
  }

  if (experience && experience !== 'Fresher') {
    return `${experience} candidate`;
  }

  if (skills.length >= 2) {
    return `${skills[0]} & ${skills[1]} practitioner`;
  }

  if (skills.length === 1) {
    return `${skills[0]} specialist`;
  }

  return 'Candidate profile';
};

const loadProfileMetaStore = () => {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_META_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

export const getProfileMeta = (user) => {
  const username = user?.username;
  if (!username) return {};
  const store = loadProfileMetaStore();
  return store[username] || {};
};

export const saveProfileMeta = (user, nextMeta) => {
  const username = user?.username;
  if (!username) return;
  const store = loadProfileMetaStore();
  store[username] = { ...(store[username] || {}), ...nextMeta };
  localStorage.setItem(PROFILE_META_STORAGE_KEY, JSON.stringify(store));
};

export const getProfessionalTitle = (profile, user) => {
  const meta = getProfileMeta(user);
  if (meta.professionalTitle) return meta.professionalTitle;
  return getCandidateHeadline(profile);
};

export const getProfilePhoto = (user) => getProfileMeta(user).profilePhoto || '';

export const resizeImageToDataUrl = (file, maxSize = 320) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
      const width = Math.round(image.width * scale);
      const height = Math.round(image.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas unavailable'));
        return;
      }

      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    image.onerror = () => reject(new Error('Invalid image file'));
    image.src = String(reader.result);
  };
  reader.onerror = () => reject(new Error('Failed to read image'));
  reader.readAsDataURL(file);
});

export const getProfileStrength = (profile, additionalFields = []) => {
  const checkpoints = [
    profile?.fullName,
    profile?.email,
    profile?.phone,
    profile?.location,
    profile?.skills,
    profile?.experience,
    profile?.graduation,
    profile?.profileSummary,
    profile?.projects,
    profile?.certifications,
    hasResume(profile?.resumeUrl),
    ...additionalFields
  ];

  const filled = checkpoints.filter(Boolean).length;
  return Math.round((filled / checkpoints.length) * 100);
};

export const parsePossibleDate = (value) => {
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

export const formatRelativeDate = (value) => {
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

export const splitTextBlocks = (value) =>
  String(value || '')
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

export const parseStructuredEntries = (value, fallbackField = 'title') => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((entry) => entry && typeof entry === 'object');
    }
  } catch {
    return splitTextBlocks(value).map((item) => ({ [fallbackField]: item }));
  }

  return [];
};

export const serializeStructuredEntries = (items, keys) => {
  const normalized = items
    .map((item) => Object.fromEntries(keys.map((key) => [key, String(item[key] || '').trim()])))
    .filter((item) => keys.some((key) => item[key]));

  return normalized.length ? JSON.stringify(normalized) : '';
};
