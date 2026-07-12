export interface OfflineAssessment {
  id: string;
  payload: any;
  editId: string | null;
  timestamp: string;
  schoolName: string;
}

const DB_NAME = 'sipeka_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'offline_assessments';

export function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Failed to open IndexedDB:', event);
      reject(new Error('Failed to open offline database'));
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

export async function addOfflineAssessment(assessment: OfflineAssessment): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(assessment);

    request.onsuccess = () => {
      // Also sync standard localStorage count or trigger windows storage events so other components can react
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('offline-assessments-updated'));
      resolve();
    };

    request.onerror = (event) => {
      console.error('Failed to save assessment to IndexedDB:', event);
      reject(new Error('Failed to save assessment offline'));
    };
  });
}

export async function getOfflineAssessments(): Promise<OfflineAssessment[]> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result as OfflineAssessment[]);
    };

    request.onerror = (event) => {
      console.error('Failed to retrieve assessments from IndexedDB:', event);
      reject(new Error('Failed to load offline data'));
    };
  });
}

export async function deleteOfflineAssessment(id: string): Promise<void> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('offline-assessments-updated'));
      resolve();
    };

    request.onerror = (event) => {
      console.error('Failed to delete assessment from IndexedDB:', event);
      reject(new Error('Failed to delete offline data'));
    };
  });
}

export async function getOfflineCount(): Promise<number> {
  const list = await getOfflineAssessments();
  return list.length;
}
