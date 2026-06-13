import { Capacitor } from '@capacitor/core';

export const isCapacitor = Capacitor.isNativePlatform();

// URLs de AI Studio
export const DEV_URL = 'https://ais-dev-2lhgcb7gzapttpghvspaia-736890033354.us-east1.run.app';
export const PRE_URL = 'https://ais-pre-2lhgcb7gzapttpghvspaia-736890033354.us-east1.run.app';

// Usamos el URL de vista previa (Pre) para móviles ya que suele ser más permisivo con conexiones externas
export const API_BASE_URL = isCapacitor ? PRE_URL : '';
export const API_PATH = '/api';

export const getFullApiUrl = (path: string) => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const finalPath = cleanPath.startsWith(API_PATH) ? cleanPath : `${API_PATH}${cleanPath}`;
  return `${API_BASE_URL}${finalPath}`;
};
