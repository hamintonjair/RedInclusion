import axios from 'axios';
import { saveOfflineRequest, cacheResponse, getCachedResponse } from './offlineSync';

const getBaseURL = () => {
  // If we are in a mobile/native app (Capacitor)
  if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
    // Return the production URL of the backend
    return 'https://ais-pre-2lhgcb7gzapttpghvspaia-736890033354.us-east1.run.app/api';
  }
  // Otherwise use relative path for web
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('auth_user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

// Intercept Axios to handle offline gracefully
api.interceptors.response.use(
  (response) => {
    // If it's a GET request, cache the response
    if (response.config.method?.toUpperCase() === 'GET' && response.config.url) {
      const cacheUrl = response.config.url + (response.config.params ? JSON.stringify(response.config.params) : '');
      cacheResponse(cacheUrl, response.data);
    }
    return response;
  },
  async (error) => {
    // If network error (offline)
    if (!navigator.onLine || error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      const config = error.config;
      const method = config.method?.toUpperCase();

      if (method === 'GET') {
        const cacheUrl = config.url + (config.params ? JSON.stringify(config.params) : '');
        const cachedData = await getCachedResponse(cacheUrl);
        if (cachedData) {
          console.warn('Network error, returning cached data for', cacheUrl);
          return Promise.resolve({ data: cachedData, status: 200, statusText: 'OK', headers: {}, config: config });
        }
      } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method!)) {
        console.warn('Network error, queueing request', config.url);
        await saveOfflineRequest(config);
        // Resolve with a mock success so UI doesn't crash, or reject depending on desired behavior.
        // Returning a mock success means the user sees "success" but it's synced later.
        return Promise.resolve({ data: { message: 'Guardado localmente. Se sincronizará al conectar.' }, status: 202, statusText: 'Accepted', headers: {}, config: config });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
