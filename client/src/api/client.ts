import axios, { AxiosError, type AxiosRequestConfig } from 'axios';

/**
 * Pre-configured Axios instance for all API calls.
 * - Base URL from environment variable
 * - Auto-attaches JWT token from localStorage
 * - Auto-redirects to login on 401
 */
const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim();
const baseUrlCandidates = configuredBaseUrl
  ? [configuredBaseUrl]
  : ['http://localhost:5000/api', 'http://localhost:5001/api'];

interface RetriableRequestConfig extends AxiosRequestConfig {
  __baseUrlRetryCount?: number;
}

const api = axios.create({
  baseURL: baseUrlCandidates[0],
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 globally
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (!error.response && originalRequest) {
      const retryCount = originalRequest.__baseUrlRetryCount ?? 0;
      const nextBaseUrl = baseUrlCandidates[retryCount + 1];

      if (nextBaseUrl) {
        originalRequest.__baseUrlRetryCount = retryCount + 1;
        originalRequest.baseURL = nextBaseUrl;
        return api.request(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
