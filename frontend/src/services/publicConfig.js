import api from './api';

let cachedConfigPromise = null;
let cachedGoogleClientId = null;

export const getPublicConfig = async () => {
  if (cachedGoogleClientId !== null) {
    return { googleClientId: cachedGoogleClientId };
  }

  if (!cachedConfigPromise) {
    cachedConfigPromise = api.get('/api/public/config')
      .then((response) => {
        const googleClientId = typeof response.data?.googleClientId === 'string'
          ? response.data.googleClientId.trim()
          : '';
        cachedGoogleClientId = googleClientId;
        return { googleClientId };
      })
      .catch((error) => {
        cachedConfigPromise = null;
        throw error;
      });
  }

  return cachedConfigPromise;
};
