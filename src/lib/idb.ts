import type { StudyData } from "../types";

const DB_NAME = "geumgong-study-manager";
const DB_VERSION = 1;
const STORE_NAME = "study";
const DATA_KEY = "data";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  runner: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const request = runner(store);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error);
        };
      }),
  );
}

export function loadStudyData(): Promise<StudyData | undefined> {
  return runTransaction<StudyData | undefined>("readonly", (store) => store.get(DATA_KEY));
}

export function saveStudyData(data: StudyData): Promise<IDBValidKey> {
  return runTransaction<IDBValidKey>("readwrite", (store) => store.put(data, DATA_KEY));
}
