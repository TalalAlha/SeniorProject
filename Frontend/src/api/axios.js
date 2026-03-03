import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Token management
const getAccessToken = () => localStorage.getItem('access_token');
const getRefreshToken = () => localStorage.getItem('refresh_token');
const setTokens = (access, refresh) => {
  localStorage.setItem('access_token', access);
  if (refresh) {
    localStorage.setItem('refresh_token', refresh);
  }
};
const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic for auth endpoints (login returning 401 = bad credentials)
    const isAuthEndpoint = originalRequest.url?.includes('/auth/token') ||
      originalRequest.url?.includes('/auth/login');

    // If error is not 401, request already retried, or it's the auth endpoint itself, reject
    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      // Handle other errors
      handleApiError(error);
      return Promise.reject(error);
    }

    // If already refreshing, queue the request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      // No refresh token, clear everything and redirect to login
      clearTokens();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    try {
      // Attempt to refresh the token
      const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      });

      const { access } = response.data;
      setTokens(access, null);

      // Update authorization header
      api.defaults.headers.common.Authorization = `Bearer ${access}`;
      originalRequest.headers.Authorization = `Bearer ${access}`;

      processQueue(null, access);

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearTokens();

      // Redirect to login
      window.location.href = '/login';

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Error handler
const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;

    switch (status) {
      case 400:
        // Validation errors - usually handled by forms
        break;
      case 403:
        toast.error('You do not have permission to perform this action');
        break;
      case 404: {
        // Don't show toast for resources that may not exist yet (new users)
        const url = error.config?.url || '';
        const silentPaths = [
          '/risk-scores/my_score/',
          '/leaderboard/my_position/',
          '/badges/my_badges/',
          '/my-points/',
        ];
        if (!silentPaths.some((path) => url.includes(path))) {
          toast.error('Resource not found');
        }
        break;
      }
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        if (data?.detail) {
          toast.error(data.detail);
        } else if (data?.message) {
          toast.error(data.message);
        }
    }
  } else if (error.request) {
    // Network error
    toast.error('Network error. Please check your connection.');
  }
};

export { api, getAccessToken, getRefreshToken, setTokens, clearTokens };
export default api;
