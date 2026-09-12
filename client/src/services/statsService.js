import api from './api';

export const getAdminStats = async () => {
  const response = await api.get('/stats/admin');
  return response.data;
};

export const getResearcherStats = async () => {
  const response = await api.get('/stats/researcher');
  return response.data;
};
