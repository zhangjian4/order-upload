import { Injectable, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Database, IUploadFile } from './database.service';
import { OcradService } from './ocrad.service';
import { OpenCVService } from './opencv.service';

@Injectable({ providedIn: 'root' })
export class PreuploadService implements OnDestroy {
  data: IUploadFile[] = [];
  updateData = new Set<IUploadFile>();
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

  async updateOrigin(id: number, origin: ImageData) {
    const item = this.data.find((i) => i.id === id);
    if (item) {
      item.origin = origin;
      item.dest = null;
      // this.revokeUrl(item);
      await this.process(item);
      if (this.persistent && item.origin === origin) {
        this.database.preuploadFile.update(id, { origin });
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
    const dest = await this.opencvService.transform(item.origin, points);
    if (item.rect === points) {
      item.dest = dest;
    }
  }

  ngOnDestroy(): void {
    console.log('destroy');
  }

  async process(item: IUploadFile) {
    // const changes: any = {};
    await this.opencvService.init();
    const changes = await this.opencvService.process(item.origin);
    const keys = Object.keys(changes);
    if (keys.length) {
      await this.database.preuploadFile.update(item.id, changes);
      keys.forEach((key) => {
        item[key] = changes[key];
      });
    }
  }
}
