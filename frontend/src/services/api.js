import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 15000,
  // Authentication uses Authorization: Bearer tokens; no cookie session is issued.
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('traceguard.accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
