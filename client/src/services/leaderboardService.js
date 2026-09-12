import api from './api';

export const getLeaderboard = async (params = {}) => {
  const response = await api.get('/leaderboard', { params });
  return response.data;
};
