import axios from 'axios';
import { Capacitor, CapacitorHttp, HttpResponse } from '@capacitor/core';
import { saveOfflineRequest, cacheResponse, getCachedResponse, setRequestExecutor, patchCachedData, getPendingRequests } from './offlineSync';
import { isCapacitor, PRE_URL, getFullApiUrl } from './config';

console.log(`[API] Platform: ${Capacitor.getPlatform()}, isCapacitor: ${isCapacitor}`);

// Local cache of network state detected dynamically or via system dispatch
let currentNetworkState: 'online' | 'offline' | 'slow' = navigator.onLine ? 'online' : 'offline';

const api = axios.create({
  baseURL: isCapacitor ? `${PRE_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 6000, // 6 seconds timeout to detect slow networks
});

const dispatchNetworkState = (state: 'online' | 'offline' | 'slow') => {
  currentNetworkState = state;
  window.dispatchEvent(new CustomEvent('app-network-status', { detail: { state } }));
};

// Listen to standard browser online/offline events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    dispatchNetworkState('online');
  });
  window.addEventListener('offline', () => {
    dispatchNetworkState('offline');
  });
}

// Helper code to map CapacitorHttp responses
const nativeRequest = async (config: any) => {
  const url = config.url.startsWith('http') ? config.url : getFullApiUrl(config.url);
  
  const options = {
    url,
    method: config.method?.toUpperCase() || 'GET',
    headers: {
      ...config.headers,
      'Content-Type': 'application/json',
      ... (isCapacitor ? { 'X-Capacitor-Http': 'true' } : {})
    },
    data: config.data,
    params: config.params
  };

  try {
    console.log(`[API-NATIVE] ${options.method} ${options.url}`);
    const response: HttpResponse = await CapacitorHttp.request(options);
    
    // Check if the response represents offline or connection failure
    if (response.status === 0 || response.status === -1) {
      console.warn(`[API-NATIVE] Connection status is ${response.status}. Throwing Network Error.`);
      const netError = new Error('Network Error');
      (netError as any).code = 'ERR_NETWORK';
      (netError as any).config = config;
      (netError as any).status = response.status;
      throw netError;
    }

    // Check if response is HTML (redirect to AI Studio log-in or typical hotspot gateway)
    if (typeof response.data === 'string' && response.data.trim().startsWith('<!doctype html>')) {
      console.error('[API-NATIVE] Server returned HTML. Requires login in AI Studio or active internet connection.');
      return {
        data: { error: 'Requiere sesión activa. Asegúrese de que la red tenga salida de internet.' },
        status: 403,
        statusText: 'Forbidden',
        headers: response.headers,
        config: config
      };
    }

    return {
      data: response.data,
      status: response.status,
      statusText: 'OK',
      headers: response.headers,
      config: config
    };
  } catch (error: any) {
    console.error('[API-NATIVE] Request failed, checking offline state...', error.message || error);
    // Attach config so the response interceptor catches it correctly
    if (!error.config) {
      error.config = config;
    }
    throw error;
  }
};

// Request interceptor to append the Authorization token
api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('auth_user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    } catch (e) {}
  }
  return config;
});

// Configure adapter based on platform
if (isCapacitor) {
  const capacitorAdapter = async (config: any) => {
    return nativeRequest(config);
  };
  (api.defaults as any).adapter = capacitorAdapter;
  setRequestExecutor(capacitorAdapter);
} else {
  setRequestExecutor(async (config: any) => api.request(config));
}

// Function to generate deterministic sorted cache keys
const buildCacheUrlKey = (url: string, params: any): string => {
  let cleanUrl = url;
  if (params && Object.keys(params).length > 0) {
    try {
      const sortedParams: any = {};
      Object.keys(params).sort().forEach(key => {
        sortedParams[key] = params[key];
      });
      cleanUrl += JSON.stringify(sortedParams);
    } catch (e) {
      cleanUrl += JSON.stringify(params);
    }
  }
  return cleanUrl;
};

// Intercept Axios replies to handle offline synchronization elegantly
api.interceptors.response.use(
  async (response) => {
    dispatchNetworkState('online');
    
    // Automatically cache GET replies
    if (response.config.method?.toUpperCase() === 'GET' && response.config.url) {
      const cacheUrl = buildCacheUrlKey(response.config.url, response.config.params);
      cacheResponse(cacheUrl, response.data);

      // Hot-patch the live server response with any pending locally queued mutations (POST/PUT/DELETE)
      // to keep the frontend completely synchronized and avoid losing sight of offline created items.
      try {
        const pending = await getPendingRequests();
        if (pending && pending.length > 0) {
          const patched = patchCachedData(cacheUrl, response.data, pending);
          response.data = patched;
        }
      } catch (patchErr) {
        console.error('[API] Error applying hot offline patches to online response:', patchErr);
      }
    }
    return response;
  },
  async (error) => {
    const config = error?.config;
    if (!config) {
      return Promise.reject(error);
    }

    const method = config.method?.toUpperCase();
    const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('exceeded');
    
    // Comprehensive check for network status
    const isOffline = currentNetworkState === 'offline' || 
                      !navigator.onLine || 
                      !error.response || 
                      error.code === 'ERR_NETWORK' || 
                      error.message === 'Network Error' || 
                      error.message?.includes('Network') || 
                      error.status === 0 ||
                      error.status === -1;

    if (isOffline || isTimeout) {
      dispatchNetworkState(isTimeout ? 'slow' : 'offline');

      if (method === 'GET') {
        const cacheUrl = buildCacheUrlKey(config.url, config.params);
        const cachedData = await getCachedResponse(cacheUrl);
        if (cachedData !== null && cachedData !== undefined) {
          console.warn('[API-Offline] Serving data from robust local cache for:', cacheUrl);
          return Promise.resolve({ data: cachedData, status: 200, statusText: 'OK', headers: {}, config: config });
        }
      } else if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method!)) {
        // Exclude authentication requests from offline queueing
        if (config.url?.includes('/auth/')) {
          console.error('[API-Offline] Authentication failed. Queuing not applicable:', config.url, error);
          return Promise.reject(error);
        }

        console.warn('[API-Offline] Queuing write operation securely:', config.url);
        await saveOfflineRequest(config);
        
        // Return 202 Accepted representing saved in local queue
        return Promise.resolve({ 
          data: { 
            message: 'Guardado localmente. Se sincronizará al conectar.',
            _isOffline: true 
          }, 
          status: 202, 
          statusText: 'Accepted', 
          headers: {}, 
          config: config 
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
