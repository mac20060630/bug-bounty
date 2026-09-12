import api from './api';

export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get('/auth/profile');
  return response.data;
};

export const logoutApi = async () => {
  try {
    const response = await api.post('/auth/logout');
    return response.data;
  } catch (error) {
    // Gracefully ignore network errors on logout
    return { success: true };
  }
};

export const checkAdminAccess = async () => {
  const response = await api.get('/auth/admin-check');
  return response.data;
};
