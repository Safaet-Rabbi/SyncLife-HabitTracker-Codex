import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

const notifySubscribers = (newToken) => {
  refreshSubscribers.forEach((callback) => callback(newToken));
  refreshSubscribers = [];
};

api.interceptors.request.use((config) => {
  if (config.skipAuth) return config;

  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config || {};
    const status = error?.response?.status;
    const message = (error?.response?.data?.message || '').toLowerCase();
    const url = String(originalRequest.url || '');

    const isAuthRoute =
      url.includes('/v1/auth/login') ||
      url.includes('/v1/auth/register') ||
      url.includes('/v1/auth/refresh') ||
      url.includes('/v1/auth/forgot-password') ||
      url.includes('/v1/auth/reset-password');

    const shouldTryRefresh =
      status === 401 &&
      !originalRequest._retry &&
      !originalRequest.skipAuth &&
      !isAuthRoute;

    if (shouldTryRefresh) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (!newToken) {
              reject(error);
              return;
            }
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      isRefreshing = true;
      try {
        const refreshResponse = await api.post('/v1/auth/refresh', {}, { skipAuth: true });
        const newToken = refreshResponse?.data?.token;
        if (newToken) {
          localStorage.setItem('authToken', newToken);
        }
        notifySubscribers(newToken);
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('authToken');
        notifySubscribers(null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (
      status === 401 &&
      (message.includes('not authorized') ||
        message.includes('token invalid') ||
        message.includes('token expired') ||
        message.includes('refresh token'))
    ) {
      localStorage.removeItem('authToken');
    }

    return Promise.reject(error);
  }
);

export const getHabits = () => api.get('/habits');
export const createHabit = (habit) => api.post('/habits', habit);
export const updateHabit = (id, habit) => api.put(`/habits/${id}`, habit);
export const deleteHabit = (id) => api.delete(`/habits/${id}`);
export const getCompletions = (params) => api.get('/completions', { params });
export const toggleCompletion = (habitId, date) => api.post('/completions/toggle', { habitId, date });

export const login = (payload) => api.post('/v1/auth/login', payload, { skipAuth: true });
export const register = (payload) => api.post('/v1/auth/register', payload, { skipAuth: true });
export const refreshSession = () => api.post('/v1/auth/refresh', {}, { skipAuth: true });
export const logoutSession = () => api.post('/v1/auth/logout', {}, { skipAuth: true });
export const forgotPassword = (payload) => api.post('/v1/auth/forgot-password', payload, { skipAuth: true });
export const resetPassword = (payload) => api.post('/v1/auth/reset-password', payload, { skipAuth: true });
export const getMe = () => api.get('/v1/auth/me');

export default api;
