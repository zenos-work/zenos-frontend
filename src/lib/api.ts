import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

//Attach token to every request
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('access_token');
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
  if (error.response.status === 401) {
    try {
      const refreshToken = sessionStorage.getItem('refresh_token');
      const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken });

      sessionStorage.setItem('access_token', response.data.access_token);
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
