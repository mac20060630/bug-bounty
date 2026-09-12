import api from './api';

export const getReports = async (params = {}) => {
  const response = await api.get('/reports', { params });
  return response.data;
};

export const getReportById = async (id) => {
  const response = await api.get(`/reports/${id}`);
  return response.data;
};

export const createReport = async (reportData) => {
  const response = await api.post('/reports', reportData);
  return response.data;
};

export const updateReport = async (id, reportData) => {
  const response = await api.put(`/reports/${id}`, reportData);
  return response.data;
};

export const updateReportStatus = async (id, statusData) => {
  const response = await api.patch(`/reports/${id}/status`, statusData);
  return response.data;
};

export const updateReportSeverity = async (id, severityData) => {
  const response = await api.patch(`/reports/${id}/severity`, severityData);
  return response.data;
};

export const getReportComments = async (id) => {
  const response = await api.get(`/reports/${id}/comments`);
  return response.data;
};

export const addReportComment = async (id, commentData) => {
  const response = await api.post(`/reports/${id}/comments`, commentData);
  return response.data;
};

export const deleteReport = async (id) => {
  const response = await api.delete(`/reports/${id}`);
  return response.data;
};
