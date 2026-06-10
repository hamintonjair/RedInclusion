import axios, { InternalAxiosRequestConfig } from 'axios';
import { openDB } from 'idb';
import { Network } from '@capacitor/network';

const DB_NAME = 'RedInclusionOfflineDB';
const STORE_NAME = 'requestsQueue';
const CACHE_STORE = 'requestCache';

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

export async function saveOfflineRequest(config: InternalAxiosRequestConfig) {
  const db = await getDB();
  await db.add(STORE_NAME, {
    url: config.url,
    method: config.method,
    data: config.data,
    headers: config.headers,
    timestamp: Date.now(),
  });
}

export async function processOfflineQueue() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const requests = await store.getAll();

  for (const req of requests) {
    try {
      await axios.request({
        url: req.url,
        method: req.method,
        data: req.data,
        headers: req.headers,
        baseURL: '/api' // Assuming same base
      });
      await store.delete(req.id);
    } catch (error) {
      console.error('Failed to sync offline request:', req, error);
      // Stop syncing on first failure to maintain order, or retry later
      break; 
    }
  }
}

export async function cacheResponse(url: string, data: any) {
  try {
    const db = await getDB();
    await db.put(CACHE_STORE, { url, data, timestamp: Date.now() });
  } catch (error) {
    console.error('Failed to cache response', error);
  }
}

export async function getCachedResponse(url: string) {
  try {
    const db = await getDB();
    const result = await db.get(CACHE_STORE, url);
    return result ? result.data : null;
  } catch (error) {
    console.error('Failed to get cached response', error);
    return null;
  }
}

window.addEventListener('online', () => {
  console.log('App is online. Processing offline queue...');
  processOfflineQueue();
});

// For Capacitor Android/iOS apps
Network.addListener('networkStatusChange', status => {
  if (status.connected) {
    console.log('App is online (Capacitor). Processing offline queue...');
    processOfflineQueue();
  }
});
