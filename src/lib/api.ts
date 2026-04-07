import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV
  ? '/'
  : (import.meta.env.VITE_API_BASE_URL || '').trim() || '/';
const AUTH_API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim();

const safeStorageGet = (storage: Storage | undefined, key: string): string | null => {
  try {
    if (storage && typeof storage.getItem === 'function') {
      return storage.getItem(key);
    }
  } catch {
    return null;
  }
  return null;
};

const safeStorageSet = (storage: Storage | undefined, key: string, value: string) => {
  try {
    if (storage && typeof storage.setItem === 'function') {
      storage.setItem(key, value);
    }
  } catch {
    // Ignore storage errors in constrained test/runtime environments.
  }
};

const api = axios.create({
  baseURL: API_BASE_URL
});

//Attach token to every request
api.interceptors.request.use((config) => {
  const token = safeStorageGet(sessionStorage, 'access_token') || safeStorageGet(localStorage, 'access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

//Auto refresh on 401 response
api.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  if (error.response?.status === 401) {
    try {
      const refreshToken = safeStorageGet(sessionStorage, 'refresh_token') || safeStorageGet(localStorage, 'refresh_token');
      const response = await axios.post(`${AUTH_API_BASE || API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });

      safeStorageSet(sessionStorage, 'access_token', response.data.access_token);
      safeStorageSet(localStorage, 'access_token', response.data.access_token);
      error.config.headers.Authorization = `Bearer ${response.data.access_token}`;
      return axios(error.config);
    } catch (refreshError) {
      console.error('Token refresh failed:', refreshError);
      // Optionally, you can clear tokens and redirect to login here
    }
  }
  return Promise.reject(error);
});

export default api;
