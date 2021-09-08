import { Injectable } from '@angular/core';
import Dexie from 'dexie';

@Injectable({ providedIn: 'root' })
export class Database extends Dexie {
  // Declare implicit table properties.
  // (just to inform Typescript. Instanciated by Dexie in stores() method)
  preuploadFile: Dexie.Table<IPreuploadFile, number>; // number = type of the primkey
  //...other tables goes here...

  constructor() {
    super('MyDatabase');
    this.version(1).stores({
      preuploadFile: '++id, name, content',
      //...other tables goes here...
    });
    // The following line is needed if your typescript
    // is compiled using babel instead of tsc:
    this.preuploadFile = this.table('preuploadFile');
  }
}

interface IPreuploadFile {
  id?: number;
  name: string;
  blob?: Blob;
}
