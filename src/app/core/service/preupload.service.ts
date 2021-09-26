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
      if (item.blob) {
        item.url = URL.createObjectURL(item.blob);
      }
      if (item.dest) {
        item.destUrl = URL.createObjectURL(item.dest);
      }
    });
  }

  async update(id: number, changes: any) {
    const item = this.data.find((i) => i.id === id);
    if (item) {
      Object.keys(changes).forEach((key) => {
        item[key] = changes[key];
      });
      await this.database.preuploadFile.update(id, changes);
      this.updateUrl(item);
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
    item.dest = await this.opencvService.transform(item.blob, item.rect);
    this.database.preuploadFile.update(item.id, { dest: item.dest });
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
    }
    if (item.destUrl) {
      URL.revokeObjectURL(item.destUrl);
    }
  }

  updateRect(item: IUploadFile, points: Point[]) {
    item.rect = points;
    this.database.preuploadFile.update(item.id, { rect: points });
    if (!this.updateData.has(item)) {
      this.updateData.add(item);
    }
  }

  ngOnDestroy(): void {
    console.log('destroy');
  }
}
