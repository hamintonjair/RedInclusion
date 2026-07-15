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

// Memory queue fallback
const memoryQueue: any[] = [];
const memoryCache = new Map<string, any>();

async function getDB() {
  try {
    return await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains(CACHE_STORE)) {
          db.createObjectStore(CACHE_STORE, { keyPath: 'url' });
        }
      },
    });
  } catch (err) {
    console.warn('[OfflineSync-DB] IndexedDB could not be opened, using localStorage fallback:', err);
    throw err;
  }
}

// LocalStorage backup helpers
function saveToLocalStorageFallback(storeName: string, item: any) {
  try {
    const key = `fallback_${storeName}`;
    const existingStr = localStorage.getItem(key) || '[]';
    const existing = JSON.parse(existingStr);
    
    if (storeName === CACHE_STORE) {
      const filtered = existing.filter((i: any) => i.url !== item.url);
      filtered.push(item);
      try {
        localStorage.setItem(key, JSON.stringify(filtered));
      } catch (innerError: any) {
        if (innerError.name === 'QuotaExceededError' || innerError.code === 22) {
          console.warn('[OfflineSync-Fallback] LocalStorage quota exceeded for requestCache. Clearing cache fallback and retrying...');
          localStorage.setItem(key, JSON.stringify([item]));
        } else {
          throw innerError;
        }
      }
    } else {
      if (!item.id) {
        item.id = Date.now() + Math.random();
      }
      existing.push(item);
      localStorage.setItem(key, JSON.stringify(existing));
    }
  } catch (e) {
    console.error(`[OfflineSync-Fallback] Failed to save to LocalStorage fallback:`, e);
  }
}

function getFromLocalStorageFallback(storeName: string, queryKey?: string): any {
  try {
    const key = `fallback_${storeName}`;
    const existingStr = localStorage.getItem(key) || '[]';
    const existing = JSON.parse(existingStr);
    
    if (storeName === CACHE_STORE && queryKey) {
      const found = existing.find((i: any) => i.url === queryKey);
      return found || null;
    }
    return existing;
  } catch (e) {
    console.error(`[OfflineSync-Fallback] Failed to read from LocalStorage fallback:`, e);
    return storeName === CACHE_STORE ? null : [];
  }
}

function deleteFromLocalStorageFallback(storeName: string, id: any) {
  try {
    const key = `fallback_${storeName}`;
    const existingStr = localStorage.getItem(key) || '[]';
    let existing = JSON.parse(existingStr);
    
    existing = existing.filter((i: any) => i.id !== id);
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (e) {
    console.error(`[OfflineSync-Fallback] Failed to delete from LocalStorage fallback:`, e);
  }
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
  
  // Replace double slashes
  clean = clean.replace(/\/+/g, '/');
  
  if (params) {
    clean += typeof params === 'string' ? params : JSON.stringify(params);
  }
  return clean;
}

function getCollectionFromUrl(url: string): string | null {
  const normalized = url.toLowerCase();
  for (const coll of COLLECTIONS) {
    if (normalized.includes(coll)) {
      return coll;
    }
  }
  return null;
}

export async function saveOfflineRequest(config: InternalAxiosRequestConfig) {
  try {
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

    const requestItem = {
      url: config.url,
      method: config.method,
      data: cleanData,
      headers: cleanHeaders,
      timestamp: Date.now(),
      offlineId: offlineId || undefined,
    };

    // Save to localStorage fallback & memory queue
    saveToLocalStorageFallback(STORE_NAME, requestItem);
    memoryQueue.push(requestItem);

    // Save to IndexedDB
    try {
      const db = await getDB();
      await db.add(STORE_NAME, requestItem);
      console.log('[OfflineSync] Request queued successfully in IndexedDB');
    } catch (idbErr) {
      console.warn('[OfflineSync] Could not save to IndexedDB, fallbacks are holding the state:', idbErr);
    }
  } catch (error) {
    console.error('[OfflineSync] Fatal error saving offline request:', error);
  }
}

export async function getPendingRequests(): Promise<any[]> {
  let pendingRequests: any[] = [];
  try {
    const db = await getDB();
    pendingRequests = await db.getAll(STORE_NAME);
  } catch (idbErr) {
    pendingRequests = getFromLocalStorageFallback(STORE_NAME);
  }

  // Combine with localStorage to make sure no requested updates are missed
  const fallbackRequests = getFromLocalStorageFallback(STORE_NAME);
  for (const r of fallbackRequests) {
    if (!pendingRequests.some((item: any) => item.id === r.id || (item.offlineId && item.offlineId === r.offlineId))) {
      pendingRequests.push(r);
    }
  }

  // Combine with memory queue
  for (const r of memoryQueue) {
    if (!pendingRequests.some((item: any) => item.id === r.id || (item.offlineId && item.offlineId === r.offlineId))) {
      pendingRequests.push(r);
    }
  }
  
  return pendingRequests;
}

export async function processOfflineQueue() {
  const requests = await getPendingRequests();
  if (!requests.length) return;
  
  if (!requestExecutor) {
    console.warn('Request executor not set yet, skipping sync.');
    return;
  }

  let db: any = null;
  try {
    db = await getDB();
  } catch (err) {
    console.warn('[OfflineSync] IndexedDB failed during processing queue, using fallbacks:', err);
  }

  const idMap = new Map<string, string>();
  console.log(`[OfflineSync] Found ${requests.length} pending requests to synchronize.`);

  for (const req of requests) {
    let reqUrl = req.url;
    // Strip any leading absolute server origin or /api prefix to avoid double prefixes
    if (reqUrl.startsWith('http://') || reqUrl.startsWith('https://')) {
      try {
        const parsed = new URL(reqUrl);
        reqUrl = parsed.pathname;
      } catch (e) {}
    }
    if (reqUrl.startsWith('/api')) {
      reqUrl = reqUrl.substring(4);
    } else if (reqUrl.startsWith('api/')) {
      reqUrl = reqUrl.substring(4);
    }
    if (!reqUrl.startsWith('/')) {
      reqUrl = '/' + reqUrl;
    }

    let reqData = req.data;

    try {
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

      // Inject the freshest live bearer token from local storage dynamically
      const userStr = localStorage.getItem('auth_user');
      let currentToken = '';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          if (user.token) {
            currentToken = user.token;
          }
        } catch (e) {}
      }

      const cleanHeaders = { ...(req.headers || {}) };
      if (currentToken) {
        cleanHeaders['Authorization'] = `Bearer ${currentToken}`;
      }

      console.log(`[OfflineSync] Syncing request: ${req.method} ${reqUrl}`);
      
      // Clean up reqData strictly before POSTing to prevent saving temporary "offline_" string values as MongoDB _ids
      let syncPayload = reqData;
      if (req.method?.toUpperCase() === 'POST' && syncPayload) {
        try {
          if (typeof syncPayload === 'string') {
            syncPayload = JSON.parse(syncPayload);
          }
          if (typeof syncPayload === 'object' && syncPayload !== null) {
            syncPayload = JSON.parse(JSON.stringify(syncPayload));
            if (syncPayload._id && String(syncPayload._id).startsWith('offline_')) {
              delete syncPayload._id;
            }
            if (syncPayload.id && String(syncPayload.id).startsWith('offline_')) {
              delete syncPayload.id;
            }
            if (syncPayload._isOffline !== undefined) {
              delete syncPayload._isOffline;
            }
          }
        } catch (e) {
          console.error('[OfflineSync] Error sanitizing payload on sync POST:', e);
        }
      }

      const response = await requestExecutor({
        url: reqUrl,
        method: req.method,
        data: syncPayload,
        headers: cleanHeaders
      });

      // Map POST offlineId to generated database ID
      if (req.method?.toUpperCase() === 'POST' && req.offlineId && response?.data) {
        const realId = response.data._id || response.data.id;
        if (realId) {
          console.log(`[OfflineSync] Mapped temp ID ${req.offlineId} to real ID ${realId}`);
          idMap.set(req.offlineId, realId);
        }
      }

      // Delete successfully completed request from IndexedDB
      if (db && req.id) {
        try {
          await db.delete(STORE_NAME, req.id);
        } catch (e) {}
      }

      // Delete successfully completed request from localStorage fallback and memory queue
      if (req.id) {
        deleteFromLocalStorageFallback(STORE_NAME, req.id);
        const index = memoryQueue.findIndex(mq => mq.id === req.id);
        if (index > -1) memoryQueue.splice(index, 1);
      }

      // Dispatch an event to notify active pages
      window.dispatchEvent(new CustomEvent('offline-record-synced', { 
        detail: { 
          method: req.method, 
          url: reqUrl,
          offlineId: req.offlineId,
          realId: response?.data?._id || response?.data?.id
        } 
      }));

    } catch (error: any) {
      console.error('[OfflineSync] Failed to sync offline request:', req, error);
      
      const status = error.response?.status || error.status;
      // If error is 4xx validation or logical error (e.g. 400 Bad Request or 409 Duplicate / Conflict)
      // we MUST delete it to make sure the remainder of the queue is NOT permanently blocked!
      const isValidationError = status >= 400 && status < 500 && status !== 401 && status !== 408 && status !== 429;
      
      if (isValidationError) {
        console.warn(`[OfflineSync] Discarding invalid/duplicate request (status ${status}) to prevent blocking of pending queue.`);
        
        // Delete rejected request from IndexedDB
        if (db && req.id) {
          try {
            await db.delete(STORE_NAME, req.id);
          } catch (e) {}
        }

        // Delete from other fallbacks
        if (req.id) {
          deleteFromLocalStorageFallback(STORE_NAME, req.id);
          const index = memoryQueue.findIndex(mq => mq.id === req.id);
          if (index > -1) memoryQueue.splice(index, 1);
        }

        window.dispatchEvent(new CustomEvent('offline-sync-item-failed', { 
          detail: { 
            method: req.method, 
            url: reqUrl,
            offlineId: req.offlineId,
            error: error.response?.data?.error || `Error de validación en servidor (${status})`
          } 
        }));

        continue;
      } else {
        // Red o servidor caído (5xx, 401, timeout, 0). Detiene la cola para que se intente cuando vuelva la señal.
        break; 
      }
    }
  }
}

export async function cacheResponse(url: string, data: any) {
  try {
    const cleanUrl = normalizeCacheUrl(url);
    let serializedData = data;
    try {
      serializedData = JSON.parse(JSON.stringify(data));
    } catch (e) {}

    // Store in memory cache & localStorage fallback synchronously immediately
    memoryCache.set(cleanUrl, serializedData);
    saveToLocalStorageFallback(CACHE_STORE, { url: cleanUrl, data: serializedData, timestamp: Date.now() });

    // Store in IndexedDB
    try {
      const db = await getDB();
      await db.put(CACHE_STORE, { url: cleanUrl, data: serializedData, timestamp: Date.now() });
    } catch (idbErr) {
      console.warn('[OfflineSync] Could not cache to IndexedDB:', idbErr);
    }
  } catch (error) {
    console.error('[OfflineSync] Cache exception:', error);
  }
}

export function patchCachedData(url: string, cachedData: any, pendingRequests: any[]) {
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
  
  // Ensure that all offline items are sorted first at the very top of the list,
  // and all items (both offline and online) are sorted chronologically descending!
  items.sort((a, b) => {
    const aOff = a && a._isOffline ? 1 : 0;
    const bOff = b && b._isOffline ? 1 : 0;
    
    // Priority 1: Offline items go to the very top
    if (aOff !== bOff) {
      return bOff - aOff;
    }
    
    // Priority 2: Sort chronologically descending
    const dateA = a ? (a.fecha_registro || a.fecha_creacion || a.createdAt || a.fecha || '') : '';
    const dateB = b ? (b.fecha_registro || b.fecha_creacion || b.createdAt || b.fecha || '') : '';
    
    if (dateA && dateB) {
      try {
        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();
        if (!isNaN(timeA) && !isNaN(timeB)) {
          return timeB - timeA;
        }
      } catch (e) {}
    }
    
    // Priority 3: Fallback value
    const idA = a ? String(a._id || a.id || '') : '';
    const idB = b ? String(b._id || b.id || '') : '';
    return idB.localeCompare(idA);
  });

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
    const cleanUrl = normalizeCacheUrl(url);
    let itemData: any = null;

    // 1. Try Memory cache first
    if (memoryCache.has(cleanUrl)) {
      itemData = memoryCache.get(cleanUrl);
    }

    // 2. Try localStorage fallback
    if (!itemData) {
      const fallbackItem = getFromLocalStorageFallback(CACHE_STORE, cleanUrl);
      if (fallbackItem) {
        itemData = fallbackItem.data;
      }
    }

    // 3. Try IndexedDB exact match
    if (!itemData) {
      try {
        const db = await getDB();
        const result = await db.get(CACHE_STORE, cleanUrl);
        if (result) itemData = result.data;
      } catch (idbErr) {
        console.warn('[OfflineSync] Could not read cache from IndexedDB:', idbErr);
      }
    }

    // 4. SMART FALLBACK: If exact match failed, search for ANY cache entry for this collection prefix!
    // (This elegantly prevents blank screens if user is offline and paginates/searches where there's no exact match).
    if (!itemData) {
      const collection = getCollectionFromUrl(cleanUrl);
      if (collection) {
        console.warn(`[OfflineSync] Cache miss for raw query: ${cleanUrl}. Searching for any cached list for collection prefix: ${collection}`);
        
        // Search in localStorage fallback list
        try {
          const fallbackStoreStr = localStorage.getItem(`fallback_${CACHE_STORE}`) || '[]';
          const fallbackStore = JSON.parse(fallbackStoreStr);
          const foundMatch = fallbackStore.find((item: any) => item.url && item.url.includes(collection));
          if (foundMatch) {
            console.log(`[OfflineSync] Found matching fallback cached list under key: ${foundMatch.url}`);
            itemData = foundMatch.data;
          }
        } catch (e) {
          console.error('[OfflineSync] Error searching collection match in fallback:', e);
        }

        // Search in IndexedDB keys
        if (!itemData) {
          try {
            const db = await getDB();
            const tx = db.transaction(CACHE_STORE, 'readonly');
            const store = tx.objectStore(CACHE_STORE);
            const keys = await store.getAllKeys();
            const matchingKey = keys.find(key => String(key).includes(collection));
            if (matchingKey) {
              const result = await store.get(matchingKey);
              if (result) {
                console.log(`[OfflineSync] Found matching IndexedDB cached list under key: ${matchingKey}`);
                itemData = result.data;
              }
            }
          } catch (e) {
            console.error('[OfflineSync] IndexedDB prefix search failed:', e);
          }
        }
      }
    }

    if (!itemData) return null;
    
    const pendingRequests = await getPendingRequests();
    if (!pendingRequests || pendingRequests.length === 0) {
      return itemData;
    }
    
    return patchCachedData(cleanUrl, itemData, pendingRequests);
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
