import { InternalAxiosRequestConfig } from 'axios';
import { openDB } from 'idb';
import { Network } from '@capacitor/network';
import { isCapacitor, getFullApiUrl } from './config';

const DB_NAME = 'RedInclusionOfflineDB';
const STORE_NAME = 'requestsQueue';
const CACHE_STORE = 'requestCache';

const COLLECTIONS = ['beneficiarios', 'actividades', 'asistente', 'lineas', 'funcionarios', 'comunas'];

let requestExecutor: ((config: any) => Promise<any>) | null = null;

export function setRequestExecutor(executor: (config: any) => Promise<any>) {
  requestExecutor = executor;
}

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'url' });
      }
    },
  });
}

export function normalizeCacheUrl(url: string, params?: any): string {
  let clean = url;
  if (clean.startsWith('http')) {
    try {
      const parsed = new URL(clean);
      clean = parsed.pathname + parsed.search;
    } catch (e) {}
  }
  if (clean.startsWith('/api')) {
    clean = clean.substring(4);
  } else if (clean.startsWith('api/')) {
    clean = clean.substring(4);
  }
  if (!clean.startsWith('/')) {
    clean = '/' + clean;
  }
  if (params) {
    clean += typeof params === 'string' ? params : JSON.stringify(params);
  }
  return clean;
}

function getCollectionFromUrl(url: string): string | null {
  const normalized = url.toLowerCase();
  for (const coll of COLLECTIONS) {
    const regex = new RegExp(`\\/${coll}(\\/|\\?|$)`);
    if (regex.test(normalized)) {
      return coll;
    }
  }
  return null;
}

export async function saveOfflineRequest(config: InternalAxiosRequestConfig) {
  const db = await getDB();
  const method = config.method?.toUpperCase();
  let offlineId = '';
  
  if (method === 'POST') {
    offlineId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    if (config.data) {
      try {
        let parsedData = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        parsedData._id = offlineId;
        parsedData.id = offlineId;
        parsedData._isOffline = true;
        config.data = parsedData;
      } catch (e) {
        console.error('Failed to inject offlineId to POST data', e);
      }
    }
  }

  // Sanitize headers to prevent DataCloneError (serialize as simple plain objects)
  let cleanHeaders: any = {};
  if (config.headers) {
    try {
      const rawHeaders = typeof (config.headers as any).toJSON === 'function'
        ? (config.headers as any).toJSON()
        : config.headers;

      for (const key in rawHeaders) {
        if (Object.prototype.hasOwnProperty.call(rawHeaders, key)) {
          const value = rawHeaders[key];
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            cleanHeaders[key] = value;
          }
        }
      }
    } catch (e) {
      console.error('Error cleaning headers for offline sync:', e);
    }
  }

  // Ensure data is structured cloneable (remove prototypes, functions, proxies, etc.)
  let cleanData = config.data;
  if (cleanData && typeof cleanData === 'object') {
    try {
      cleanData = JSON.parse(JSON.stringify(cleanData));
    } catch (e) {
      console.error('Error serializing data for offline sync:', e);
    }
  }

  await db.add(STORE_NAME, {
    url: config.url,
    method: config.method,
    data: cleanData,
    headers: cleanHeaders,
    timestamp: Date.now(),
    offlineId: offlineId || undefined,
  });
}

export async function processOfflineQueue() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const requests = await store.getAll();

  if (!requests.length) return;
  if (!requestExecutor) {
    console.warn('Request executor not set yet, skipping sync.');
    return;
  }

  const idMap = new Map<string, string>();

  for (const req of requests) {
    try {
      let reqUrl = req.url;
      let reqData = req.data;

      // Translate offline temp IDs to real database IDs
      idMap.forEach((realId, tempId) => {
        if (reqUrl.includes(tempId)) {
          console.log(`[OfflineSync] Translating tempId in URL: ${tempId} -> ${realId}`);
          reqUrl = reqUrl.replace(tempId, realId);
        }
        if (reqData) {
          try {
            const reqDataStr = JSON.stringify(reqData);
            if (reqDataStr.includes(tempId)) {
              console.log(`[OfflineSync] Translating tempId in body data: ${tempId} -> ${realId}`);
              reqData = JSON.parse(reqDataStr.replace(new RegExp(tempId, 'g'), realId));
            }
          } catch (e) {
            console.error('[OfflineSync] Failed to translating tempId in body data', e);
          }
        }
      });

      console.log(`[OfflineSync] Syncing request: ${req.method} ${reqUrl}`);
      const response = await requestExecutor({
        url: reqUrl,
        method: req.method,
        data: reqData,
        headers: req.headers
      });

      // Map POST offlineId to generated database ID
      if (req.method?.toUpperCase() === 'POST' && req.offlineId && response?.data) {
        const realId = response.data._id || response.data.id;
        if (realId) {
          console.log(`[OfflineSync] Mapped temp ID ${req.offlineId} to real ID ${realId}`);
          idMap.set(req.offlineId, realId);
        }
      }

      await store.delete(req.id);
      
      // Dispatch an event to notify pages
      window.dispatchEvent(new CustomEvent('offline-record-synced', { 
        detail: { 
          method: req.method, 
          url: reqUrl,
          offlineId: req.offlineId,
          realId: response?.data?._id || response?.data?.id
        } 
      }));

    } catch (error) {
      console.error('Failed to sync offline request:', req, error);
      break; 
    }
  }
}

export async function cacheResponse(url: string, data: any) {
  try {
    const db = await getDB();
    const cleanUrl = normalizeCacheUrl(url);
    let serializedData = data;
    try {
      serializedData = JSON.parse(JSON.stringify(data));
    } catch (e) {}
    await db.put(CACHE_STORE, { url: cleanUrl, data: serializedData, timestamp: Date.now() });
  } catch (error) {
    console.error('Failed to cache response', error);
  }
}

function patchCachedData(url: string, cachedData: any, pendingRequests: any[]) {
  const collection = getCollectionFromUrl(url);
  if (!collection) return cachedData;
  
  // Filter mutations (POST/PUT/DELETE) belonging to this collection
  const relevantMutations = pendingRequests.filter(req => {
    const method = req.method?.toUpperCase();
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) return false;
    
    const reqCollection = getCollectionFromUrl(req.url);
    return reqCollection === collection;
  });
  
  if (relevantMutations.length === 0) return cachedData;
  
  let deepCopy = JSON.parse(JSON.stringify(cachedData));
  let items: any[] = [];
  let isPaginatedWrapper = false;
  
  if (Array.isArray(deepCopy)) {
    items = deepCopy;
  } else if (deepCopy && Array.isArray(deepCopy.data)) {
    items = deepCopy.data;
    isPaginatedWrapper = true;
  } else {
    // Check if it is a detail object e.g., GET /beneficiarios/1234
    const urlParts = url.split('?')[0].split('/').filter(Boolean);
    const lastSegment = urlParts[urlParts.length - 1];
    const isDetailQuery = lastSegment && lastSegment !== collection;
    
    if (isDetailQuery) {
      for (const req of relevantMutations) {
        const method = req.method?.toUpperCase();
        const reqParts = req.url.split('?')[0].split('/').filter(Boolean);
        const reqLastId = reqParts[reqParts.length - 1];
        
        if (reqLastId === lastSegment) {
          if (method === 'PUT' || method === 'PATCH') {
            deepCopy = {
              ...deepCopy,
              ...req.data,
              _isOffline: true
            };
          } else if (method === 'DELETE') {
            return null;
          }
        }
      }
      return deepCopy;
    }
    
    return cachedData;
  }
  
  for (const req of relevantMutations) {
    const method = req.method?.toUpperCase();
    const reqParts = req.url.split('?')[0].split('/').filter(Boolean);
    const lastPart = reqParts[reqParts.length - 1];
    const hasId = lastPart && lastPart !== collection;
    
    if (method === 'POST') {
      const offlineId = req.offlineId || `offline_${req.timestamp || Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      req.offlineId = offlineId;
      
      const newItem = {
        _id: offlineId,
        id: offlineId,
        _isOffline: true,
        ...req.data
      };
      
      if (!newItem.createdAt) newItem.createdAt = new Date().toISOString();
      
      const exists = items.some(item => item._id === offlineId || item.id === offlineId);
      if (!exists) {
        items.unshift(newItem);
      }
    } else if ((method === 'PUT' || method === 'PATCH') && hasId) {
      items = items.map(item => {
        if (item._id === lastPart || item.id === lastPart) {
          return {
            ...item,
            ...req.data,
            _isOffline: true
          };
        }
        return item;
      });
    } else if (method === 'DELETE' && hasId) {
      items = items.filter(item => item._id !== lastPart && item.id !== lastPart);
    }
  }
  
  if (isPaginatedWrapper) {
    deepCopy.data = items;
    deepCopy.total = items.length;
    if (deepCopy.limit) {
      deepCopy.totalPages = Math.ceil(items.length / deepCopy.limit);
    }
  } else {
    deepCopy = items;
  }
  
  return deepCopy;
}

export async function getCachedResponse(url: string) {
  try {
    const db = await getDB();
    const cleanUrl = normalizeCacheUrl(url);
    const result = await db.get(CACHE_STORE, cleanUrl);
    if (!result) return null;
    
    const pendingRequests = await db.getAll(STORE_NAME);
    if (!pendingRequests || pendingRequests.length === 0) {
      return result.data;
    }
    
    return patchCachedData(cleanUrl, result.data, pendingRequests);
  } catch (error) {
    console.error('Failed to get cached response', error);
    return null;
  }
}

window.addEventListener('online', () => {
  console.log('App is online. Processing offline queue...');
  processOfflineQueue();
});

Network.addListener('networkStatusChange', status => {
  if (status.connected) {
    console.log('App is online (Capacitor). Processing offline queue...');
    processOfflineQueue();
  }
});

