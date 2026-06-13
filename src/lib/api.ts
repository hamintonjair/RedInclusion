import axios from 'axios';
import { Capacitor, CapacitorHttp, HttpResponse } from '@capacitor/core';
import { saveOfflineRequest, cacheResponse, getCachedResponse } from './offlineSync';

// Detectar si estamos en un entorno móvil (Capacitor)
const isCapacitor = Capacitor.isNativePlatform();

// URL del servidor para la app móvil. 
// Usamos el URL compartido (pre) para móviles ya que suele permitir conexiones externas sin bloqueos de sesión del IDE.
const productionUrl = 'https://ais-pre-2lhgcb7gzapttpghvspaia-736890033354.us-east1.run.app';
const devUrl = 'https://ais-dev-2lhgcb7gzapttpghvspaia-736890033354.us-east1.run.app';


console.log(`[API] Platform: ${Capacitor.getPlatform()}, isCapacitor: ${isCapacitor}`);

// Configuración de Axios para Web (cuando no es Capacitor)
const api = axios.create({
  baseURL: isCapacitor ? `${productionUrl}/api` : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Función auxiliar para hacer peticiones usando CapacitorHttp (nativo)
const nativeRequest = async (config: any) => {
  const url = config.url.startsWith('http') ? config.url : `${productionUrl}${config.url.startsWith('/') ? config.url : '/api/' + config.url}`;
  
  const options = {
    url,
    method: config.method?.toUpperCase() || 'GET',
    headers: {
      ...config.headers,
      'Content-Type': 'application/json',
    },
    data: config.data,
    params: config.params
  };

  try {
    console.log(`[API-NATIVE] ${options.method} ${options.url}`);
    const response: HttpResponse = await CapacitorHttp.request(options);
    
    // Adaptar respuesta de CapacitorHttp al formato que espera Axios/App
    return {
      data: response.data,
      status: response.status,
      statusText: 'OK',
      headers: response.headers,
      config: config
    };
  } catch (error) {
    console.error('[API-NATIVE] Error:', error);
    throw error;
  }
};

// Request Interceptor para añadir el Token
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

// Interceptamos la llamada principal si es Capacitor para usar el plugin nativo
if (isCapacitor) {
  // Sobrescribimos el adapter de axios para usar CapacitorHttp
  // Esto es más limpio que interceptar cada método
  (api.defaults as any).adapter = async (config: any) => {
    return nativeRequest(config);
  };
}

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
    if (!navigator.onLine || error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.status === 0) {
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
        // No interceptar login/registro para el modo offline ya que requieren auth real
        if (config.url?.includes('/auth/')) {
          console.error('Auth request failed and cannot be queued:', config.url, error);
          return Promise.reject(error);
        }

        console.warn('Network error, queueing request', config.url);
        await saveOfflineRequest(config);
        return Promise.resolve({ data: { message: 'Guardado localmente. Se sincronizará al conectar.' }, status: 202, statusText: 'Accepted', headers: {}, config: config });
      }
    }
    return Promise.reject(error);
  }
);

export default api;
