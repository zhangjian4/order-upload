import { Injectable } from '@angular/core';

export const PREUPLOAD_PHOTO = 'preupload-photo';

@Injectable({ providedIn: 'root' })
export class IndexedDBService {
  private databaseName = 'my-db';
  private version = 3;
  // private stores = [
  //   { name: PREUPLOAD_PHOTO, options: { autoIncrement: true } },
  // ];
  private stores = {
    [PREUPLOAD_PHOTO]: { autoIncrement: true },
  };

  private db: Promise<IDBDatabase>;

  private open() {
    if (!this.db) {
      this.db = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(this.databaseName, this.version);
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          Object.keys(this.stores).forEach((name) => {
            const options = this.stores[name];
            if (!db.objectStoreNames.contains(name)) {
              db.createObjectStore(name, options);
            }
          });
        };
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          resolve(db);
        };
        request.onerror = reject;
      });
    }
    return this.db;
  }

  async add(storeName: string, data: any) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      var request = db
        .transaction(storeName, 'readwrite')
        .objectStore(storeName)
        .add(data);
      request.onsuccess = resolve;
      request.onerror = reject;
    });
  }

  async readAll(storeName: string, keys?: string[]) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      var objectStore = db.transaction(storeName).objectStore(storeName);
      const request = objectStore.openCursor();
      const result = [];
      request.onsuccess = (event) => {
        var cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const data = { id: cursor.key };
          if (keys) {
            keys.forEach((key) => (data[key] = cursor.value[key]));
          } else {
            Object.assign(data, cursor.value);
          }
          result.push(data);
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      request.onerror = reject;
    });
  }
}
