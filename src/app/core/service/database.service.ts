import { Injectable } from '@angular/core';
import Dexie from 'dexie';

@Injectable({ providedIn: 'root' })
export class Database extends Dexie {
  // Declare implicit table properties.
  // (just to inform Typescript. Instanciated by Dexie in stores() method)
  preuploadFile: Dexie.Table<IUploadFile, number>; // number = type of the primkey
  uploadFile: Dexie.Table<IUploadFile, number>;
  //...other tables goes here...

  constructor() {
    super('MyDatabase');
    this.version(4).stores({
      preuploadFile: '++id, name, blob, md5',
      uploadFile: '++id, name, blob, md5',
      //...other tables goes here...
    });
    // The following line is needed if your typescript
    // is compiled using babel instead of tsc:
    this.preuploadFile = this.table('preuploadFile');
    this.uploadFile = this.table('uploadFile');
  }
}

export interface IUploadFile {
  rect?: any;
  id?: number;
  name: string;
  md5: string;
  blob?: Blob;
  dest?: Blob;
}
