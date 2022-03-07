import { Injectable, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Database, IUploadFile } from './database.service';
import { OcradService } from './ocrad.service';
import { OpenCVService } from './opencv.service';

@Injectable({ providedIn: 'root' })
export class PreuploadService implements OnDestroy {
  data: IUploadFile[] = [];
  updateData = new Set<IUploadFile>();
  id = 1;
  private readonly persistent = false;

  constructor(
    private database: Database,
    private opencvService: OpenCVService,
    private domSanitizer: DomSanitizer,
    private ocradService: OcradService
  ) {}

  async reload() {
    if (this.persistent) {
      this.data = await this.database.preuploadFile.toArray();
      // this.data.forEach((item) => {
      //   this.createUrl(item);
      // });
    } else {
      this.data = this.data.filter((item) => !item.deleted);
    }
  }

  async add(item: IUploadFile) {
    item.id = this.id++;
    this.data.push(item);
    if (this.persistent) {
      await this.database.preuploadFile.add(item);
    }
  }

  // createUrl(item: IUploadFile) {
  //   if (item.blob) {
  //     item.url = URL.createObjectURL(item.blob);
  //   }
  //   if (item.dest) {
  //     item.destUrl = URL.createObjectURL(item.dest);
  //   }
  // }

  async updateOrigin(id: number, imageData: ArrayBuffer) {
    const item = this.data.find((i) => i.id === id);
    if (item) {
      this.database.imageData.delete(item.origin);
      const imageId = await this.saveImageData(imageData);
      item.origin = imageId;
      item.dest = null;
      // this.revokeUrl(item);
      await this.process(item, imageData);
      if (this.persistent && item.origin === imageId) {
        this.database.preuploadFile.update(id, { origin: imageId });
      }
      // this.createUrl(item);
    }
  }

  async remove(item: IUploadFile, reload?: boolean) {
    if (item) {
      item.deleted = true;
      if (this.persistent) {
        await this.database.preuploadFile.delete(item.id);
      }
      if (reload) {
        this.data = this.data.filter((i) => i !== item);
      }
      // this.revokeUrl(item);
      // this.data = this.data.filter((i) => i !== item);
      // if (this.updateData.has(item)) {
      //   this.updateData.delete(item);
      // }
    }
  }

  async rename(item: IUploadFile, name: string) {
    item.name = name;
    if (this.persistent) {
      await this.database.preuploadFile.update(item.id, {
        name,
      });
    }
  }

  // async updateUrls() {
  //   if (this.updateData.size) {
  //     const promises = [];
  //     this.updateData.forEach((item) => {
  //       promises.push(this.updateUrl(item));
  //     });
  //     await Promise.all(promises);
  //   }
  // }

  // async updateUrl(item: any) {
  //   if (item.rect) {
  //     item.dest = await this.opencvService.transform(item.blob, item.rect);
  //   } else {
  //     item.dest = null;
  //   }
  //   this.database.preuploadFile.update(item.id, {
  //     rect: item.rect,
  //     dest: item.dest,
  //   });
  //   if (item.destUrl) {
  //     URL.revokeObjectURL(item.destUrl);
  //   }
  //   item.destUrl = URL.createObjectURL(item.dest);
  //   this.updateData.delete(item);
  // }

  clear() {
    this.data = [];
    this.database.imageData.clear();
    if (this.persistent) {
      if (this.persistent) {
        this.database.preuploadFile.clear();
      }
    }
  }

  revokeUrl(item: any) {
    if (item.url) {
      URL.revokeObjectURL(item.url);
      delete item.url;
    }
    if (item.destUrl) {
      URL.revokeObjectURL(item.destUrl);
      delete item.destUrl;
    }
  }

  async updateRect(item: IUploadFile, points: { x: number; y: number }[]) {
    item.rect = points;
    const imageData = await this.getImageData(item.origin);
    const dest = await this.opencvService.transform(imageData, points);
    const imageId = await this.saveImageData(dest);
    if (item.rect === points) {
      item.dest = imageId;
    }
  }

  ngOnDestroy(): void {
    console.log('destroy');
  }

  async process(item: IUploadFile, imageData: ArrayBuffer) {
    // const changes: any = {};
    await this.opencvService.init();
    const changes = await this.opencvService.process(imageData);
    const keys = Object.keys(changes);
    if (keys.length) {
      for (const key of keys) {
        let value = changes[key];
        if (value instanceof ArrayBuffer) {
          value = await this.saveImageData(value);
          changes[key] = value;
          const oldValue = item[key];
          if (oldValue) {
            this.deleteImageData(oldValue);
          }
        }
        item[key] = value;
      }
      if (this.persistent) {
        await this.database.preuploadFile.update(item.id, changes);
      }
    }
  }

  async saveImageData(data: ArrayBuffer) {
    const id = await this.database.imageData.add({ data });
    return id;
  }

  async getImageData(id: number) {
    const record = await this.database.imageData.get(id);
    return record.data;
  }

  deleteImageData(id: number) {
    return this.database.imageData.delete(id);
  }
}
