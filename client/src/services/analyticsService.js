import api from './api';

export const getAdminAnalytics = async () => {
  const response = await api.get('/analytics/admin');
  return response.data;
};

export const getResearcherAnalytics = async () => {
  const response = await api.get('/analytics/researcher');
  return response.data;
};
