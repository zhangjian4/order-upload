import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class IndexedDBService {
  open(databaseName: string = 'defaultdb', version?: number) {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(databaseName, version);
      request.onsuccess = (event) => {
        console.log(event);
        const db = request.result;
        resolve(db);
      };
      request.onerror = reject;
    });
  }
}
