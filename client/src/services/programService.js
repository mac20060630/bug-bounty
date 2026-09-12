import api from './api';

export const getPrograms = async (params = {}) => {
  const response = await api.get('/programs', { params });
  return response.data;
};

export const getProgramById = async (id) => {
  const response = await api.get(`/programs/${id}`);
  return response.data;
};

export const createProgram = async (programData) => {
  const response = await api.post('/programs', programData);
  return response.data;
};

export const updateProgram = async (id, programData) => {
  const response = await api.put(`/programs/${id}`, programData);
  return response.data;
};

export const deleteProgram = async (id) => {
  const response = await api.delete(`/programs/${id}`);
  return response.data;
};
