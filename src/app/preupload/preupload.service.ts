import { Injectable, OnDestroy } from '@angular/core';
import { IUploadFile } from '../core/service/database.service';

@Injectable()
export class PreuploadService implements OnDestroy {
  data: IUploadFile[] = [];
  ngOnDestroy(): void {
    console.log('destroy');
  }
}
