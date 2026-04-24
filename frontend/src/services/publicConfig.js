import api from './api';

let cachedConfigPromise = null;
let cachedGoogleClientId = null;
let cachedCompanyName = null;
let cachedOfficialEmail = null;

export const getPublicConfig = async () => {
  if (cachedGoogleClientId !== null || cachedCompanyName !== null || cachedOfficialEmail !== null) {
    return {
      googleClientId: cachedGoogleClientId,
      companyName: cachedCompanyName,
      officialEmail: cachedOfficialEmail
    };
  }

  if (!cachedConfigPromise) {
    cachedConfigPromise = api.get('/api/public/config')
      .then((response) => {
        const googleClientId = typeof response.data?.googleClientId === 'string'
          ? response.data.googleClientId.trim()
          : '';
        const companyName = typeof response.data?.companyName === 'string'
          ? response.data.companyName.trim()
          : 'CareerLink';
        const officialEmail = typeof response.data?.officialEmail === 'string'
          ? response.data.officialEmail.trim()
          : 'support@careerlink.com';
        cachedGoogleClientId = googleClientId;
        cachedCompanyName = companyName;
        cachedOfficialEmail = officialEmail;
        return { googleClientId, companyName, officialEmail };
      })
      .catch((error) => {
        cachedConfigPromise = null;
        throw error;
      });
  }

  return cachedConfigPromise;
};
