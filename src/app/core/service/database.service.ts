import { Injectable } from '@angular/core';
import Dexie from 'dexie';
import { Point } from '../model';
(Dexie as any).debug = false;
@Injectable({ providedIn: 'root' })
export class Database extends Dexie {
  // Declare implicit table properties.
  // (just to inform Typescript. Instanciated by Dexie in stores() method)
  preuploadFile: Dexie.Table<IUploadFile, number>; // number = type of the primkey
  imageData: Dexie.Table<MyImageData, number>;
  // uploadFile: Dexie.Table<IUploadFile, number>;
  //...other tables goes here...

  constructor() {
    super('MyDatabase');
    this.version(7).stores({
      preuploadFile: '++id, name, blob, md5',
      imageData: '++id,data',
      // uploadFile: '++id, name, blob, md5',
      //...other tables goes here...
    });
    // The following line is needed if your typescript
    // is compiled using babel instead of tsc:
    this.preuploadFile = this.table('preuploadFile');
    this.imageData = this.table('imageData');
    console.log((Dexie as any).debug);
    // this.uploadFile = this.table('uploadFile');
  }
}

export interface IUploadFile {
  size?: number;
  destUrl?: string;
  url?: string;
  rect?: Point[];
  id?: number;
  name?: string;
  md5?: string;
  origin?: number;
  blob?: Blob;
  dest?: number;
  deleted?: boolean;
}

export interface MyImageData {
  id?: number;
  data?: ArrayBuffer;
}
