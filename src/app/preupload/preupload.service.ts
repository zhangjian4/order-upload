import { Injectable, OnDestroy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Point } from 'opencv-ts';
import { Database, IUploadFile } from '../core/service/database.service';
import { OpenCVService } from '../core/service/opencv.service';

@Injectable()
export class PreuploadService implements OnDestroy {
  data: IUploadFile[] = [];
  updateData = new Set<IUploadFile>();

  constructor(
    private database: Database,
    private opencvService: OpenCVService,
    private domSanitizer:DomSanitizer
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

  updateUrls() {
    this.updateData.forEach(async (item) => {
      item.dest = await this.opencvService.transform(item.blob, item.rect);
      this.database.preuploadFile.update(item.id, { dest: item.dest });
      if (item.destUrl) {
        URL.revokeObjectURL(item.destUrl);
      }
      item.destUrl = URL.createObjectURL(item.dest);
      this.updateData.delete(item);
    });
  }

  clear() {
    this.data.forEach((item) => {
      if (item.url) {
        URL.revokeObjectURL(item.url);
      }
      if (item.destUrl) {
        URL.revokeObjectURL(item.destUrl);
      }
    });
    this.data = [];
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
