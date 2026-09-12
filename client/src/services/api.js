import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor: Attach JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bugbounty_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Authentication Expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Avoid redirecting if user was attempting to log in with bad credentials
      const requestUrl = error.config ? error.config.url : '';
      if (!requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/register')) {
        localStorage.removeItem('bugbounty_token');
        localStorage.removeItem('bugbounty_user');
        window.dispatchEvent(new Event('bugbounty:session_expired'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
