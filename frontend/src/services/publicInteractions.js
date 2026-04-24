import api from './api';

export const submitPublicContact = async (payload) => {
  const response = await api.post('/api/public/contact', payload);
  return response.data;
};

export const submitPublicReview = async (payload) => {
  const response = await api.post('/api/public/review', payload);
  return response.data;
};
