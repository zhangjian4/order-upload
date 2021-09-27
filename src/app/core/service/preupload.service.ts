import { Injectable, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Point } from 'opencv-ts';
import { Database, IUploadFile } from './database.service';
import { OpenCVService } from './opencv.service';

@Injectable({ providedIn: 'root' })
export class PreuploadService implements OnDestroy {
  data: IUploadFile[] = [];
  updateData = new Set<IUploadFile>();

  constructor(
    private database: Database,
    private opencvService: OpenCVService,
    private domSanitizer: DomSanitizer
  ) {}

  async reload() {
    if (this.data.length) {
      this.clear();
    }
    this.data = await this.database.preuploadFile.toArray();
    this.data.forEach((item) => {
      this.createUrl(item);
    });
  }

  createUrl(item: IUploadFile) {
    if (item.blob) {
      item.url = URL.createObjectURL(item.blob);
    }
    if (item.dest) {
      item.destUrl = URL.createObjectURL(item.dest);
    }
  }

  async updateBlob(id: number, blob: Blob) {
    const item = this.data.find((i) => i.id === id);
    if (item) {
      item.blob = blob;
      item.dest = null;
      this.revokeUrl(item);
      this.database.preuploadFile.update(id, { blob });
      const rect = await this.opencvService.getPagerRect(blob);
      this.updateRect(item, rect);
      this.createUrl(item);
    }
  }

  // async transform(item: IUploadFile) {
  //   const src = await this.opencvService.fromBlob(item.blob);
  //   try {
  //     const rect = await this.opencvService.getPagerRect(src);
  //     if (rect.length === 4) {
  //       const dest = await this.opencvService.transform(src, rect);
  //       await this.database.preuploadFile.update(id, { rect, dest });
  //     }
  //     // await this.sleep();
  //   } catch (e) {
  //     console.error(e);
  //   } finally {
  //     src.delete();
  //   }
  // }

  // async handlePhoto(id: number, blob: Blob) {
  //   const src = await this.opencvService.fromBlob(blob);
  //   try {
  //     const rect = await this.opencvService.getPagerRect(src);
  //     if (rect.length === 4) {
  //       const dest = await this.opencvService.transform(src, rect);
  //       await this.database.preuploadFile.update(id, { rect, dest });
  //     }
  //     // await this.sleep();
  //   } catch (e) {
  //     console.error(e);
  //   } finally {
  //     src.delete();
  //   }
  // }

  async remove(item: IUploadFile) {
    if (item) {
      this.revokeUrl(item);
      await this.database.preuploadFile.delete(item.id);
      this.data = this.data.filter((i) => i !== item);
      if (this.updateData.has(item)) {
        this.updateData.delete(item);
      }
    }
  }

  async updateUrls() {
    if (this.updateData.size) {
      const promises = [];
      this.updateData.forEach((item) => {
        promises.push(this.updateUrl(item));
      });
      await Promise.all(promises);
    }
  }

  async updateUrl(item: any) {
    if (item.rect) {
      item.dest = await this.opencvService.transform(item.blob, item.rect);
    } else {
      item.dest = null;
    }
    this.database.preuploadFile.update(item.id, {
      rect: item.rect,
      dest: item.dest,
    });
    if (item.destUrl) {
      URL.revokeObjectURL(item.destUrl);
    }
    item.destUrl = URL.createObjectURL(item.dest);
    this.updateData.delete(item);
  }

  clear() {
    this.data.forEach((item) => {
      this.revokeUrl(item);
    });
    this.data = [];
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

  updateRect(item: IUploadFile, points: Point[]) {
    item.rect = points;
    if (!this.updateData.has(item)) {
      this.updateData.add(item);
    }
  }

  ngOnDestroy(): void {
    console.log('destroy');
  }
}
