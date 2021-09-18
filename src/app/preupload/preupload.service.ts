import { Injectable, OnDestroy } from '@angular/core';
import { Point } from 'opencv-ts';
import { Database, IUploadFile } from '../core/service/database.service';

@Injectable()
export class PreuploadService implements OnDestroy {
  data: IUploadFile[] = [];
  updateData = new Set<IUploadFile>();

  constructor(private database: Database) {}

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
