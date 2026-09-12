import api from './api';

export const getRewards = async (params = {}) => {
  const response = await api.get('/rewards', { params });
  return response.data;
};

export const assignReward = async (rewardData) => {
  const response = await api.post('/rewards', rewardData);
  return response.data;
};
