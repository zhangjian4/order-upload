import { Injectable } from '@angular/core';
import { LazyService } from './lazy.service';

declare const OCRAD;

@Injectable({
  providedIn: 'root',
})
export class OcradService {
  private init$: Promise<any>;
  constructor(private lazy: LazyService) {}

  init() {
    if (this.init$ == null) {
      this.init$ = this.lazy.loadScript('/assets/js/ocrad.js');
    }
    return this.init$;
  }

  async execute(image: HTMLImageElement | HTMLCanvasElement, options?: any) {
    await this.init();
    return new Promise<string>((resolve, reject) => {
      OCRAD(
        image,
        options,
        (text: string) => {
          resolve(text);
        },
        reject
      );
    });
  }
}
