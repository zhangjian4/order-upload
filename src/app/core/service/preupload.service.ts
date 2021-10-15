import { Injectable, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Mat, Point } from 'opencv-ts';
import { Database, IUploadFile } from './database.service';
import { OcradService } from './ocrad.service';
import { OpenCVService } from './opencv.service';

@Injectable({ providedIn: 'root' })
export class PreuploadService implements OnDestroy {
  data: IUploadFile[] = [];
  updateData = new Set<IUploadFile>();

  constructor(
    private database: Database,
    private opencvService: OpenCVService,
    private domSanitizer: DomSanitizer,
    private ocradService: OcradService
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
      await this.process(item);
      if (item.blob === blob) {
        this.database.preuploadFile.update(id, { blob });
      }
      this.createUrl(item);
    }
  }

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

  async rename(item: IUploadFile, name: string) {
    item.name = name;
    await this.database.preuploadFile.update(item.id, {
      name,
    });
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

  async process(item: IUploadFile) {
    const changes: any = {};
    await this.opencvService.init();
    const mat = await this.opencvService.fromBlob(item.blob);
    if (mat.rows > mat.cols) {
      this.opencvService.rotate(mat, 90);
      changes.blob = await this.opencvService.toBlob(mat);
    }
    const ratio = 900 / mat.rows;
    const resize = this.opencvService.resizeImg(mat, ratio);
    try {
      const canny = this.opencvService.getCanny(resize);
      const maxContour = this.opencvService.findMaxContour(canny);
      canny.delete();
      const points = this.opencvService.getBoxPoint(maxContour, ratio);
      maxContour.delete();
      if (points.length === 4) {
        const dest = await this.opencvService.transform(mat, points);
        changes.rect = points;
        changes.dest = dest;
      }
    } catch (e) {
      console.error(e);
    }
    mat.delete();
    const dst1 = this.opencvService.extractColor(resize);
    resize.delete();
    const rect = this.opencvService.getCenterRect(dst1);
    try {
      if (rect) {
        const dst2 = this.opencvService.crop(dst1, rect);
        this.opencvService.resizeTo(dst2, { minHeight: 50 });
        const canvas = this.opencvService.toCanvas(dst2);
        dst2.delete();
        let text = await this.ocradService.execute(canvas, {
          numeric: true,
        });
        text = text.trim();
        console.log(text);
        changes.name = text;
      }
    } catch (e) {
      console.error(e);
    } finally {
      dst1.delete();
    }
    const keys = Object.keys(changes);
    if (keys.length) {
      await this.database.preuploadFile.update(item.id, changes);
      keys.forEach((key) => {
        item[key] = changes[key];
      });
    }
  }
}
