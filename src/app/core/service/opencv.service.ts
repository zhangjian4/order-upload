import { Injectable } from '@angular/core';
import { LazyService } from './lazy.service';

declare const cv: any;

@Injectable({ providedIn: 'root' })
export class OpenCVService {
  constructor(private lazy: LazyService) {}
  private initPromise: Promise<void>;

  init() {
    if (this.initPromise == null) {
      this.initPromise = new Promise(async (resolve) => {
        await this.lazy.loadScript('/assets/js/opencv.js');
        cv.then(() => {
          resolve();
        });
      });
    }
    return this.initPromise;
  }
}
