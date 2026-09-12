import api from './api';

export const uploadEvidenceFiles = async (files) => {
  const formData = new FormData();

  Array.from(files).forEach((file) => {
    formData.append('evidence', file);
  });

  const response = await api.post('/upload/evidence', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};
