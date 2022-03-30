import { Injectable } from '@angular/core';
import { Point } from '../model';
// import { OcradService } from './ocrad.service';

@Injectable({ providedIn: 'root' })
export class OpenCVService {
  worker: Worker;
  private messageId = 0;
  private initPromise: Promise<void>;
  private resolveMap = {};
  constructor() {
    this.worker = new Worker(
      new URL('../../worker/opencv.worker', import.meta.url)
    );
    // worker.onmessage = ({ data }) => {
    //   console.log(`page got message: ${data}`);
    // };
    // worker.postMessage('hello');
    // this.worker = new Worker('/assets/js/opencv.worker.js');
    this.worker.onmessage = (event: MessageEvent) => {
      const result = event.data;
      const resolve = this.resolveMap[result.messageId];
      if (resolve) {
        // console.log(
        //   'execute ' +
        //     resolve.method +
        //     ' end:' +
        //     (new Date().getTime() - resolve.start)
        // );
        if (result.success) {
          resolve.resolve(result.data);
        } else {
          resolve.reject(result.error);
        }
        delete this.resolveMap[result.messageId];
      }
    };
  }

  init() {
    if (!this.initPromise) {
      this.initPromise = this.execute('init');
    }
    return this.initPromise;
  }

  async transform(imageData: ArrayBuffer, points: Point[]) {
    const dst: ArrayBuffer = await this.execute('warpImage', imageData, points);
    return dst;
  }

  async preview(base64: string | ArrayBuffer) {
    const result = await this.execute('preview', base64);
    return result;
  }
  async process(imageData: ArrayBuffer, points: Point[]) {
    // const imageData = await this.fromBlob(blob);
    const result = await this.execute('process', imageData, points);
    return result;
  }
  async debug(imageData: ArrayBuffer): Promise<ArrayBuffer[]> {
    return this.execute('debug', imageData);
  }
  private execute(method: string, ...args: any[]): Promise<any> {
    const messageId = this.messageId++;
    const transfer = [];
    args.forEach((arg) => {
      if (arg instanceof ArrayBuffer) {
        transfer.push(arg);
      }
    });
    this.worker.postMessage({ messageId, method, args }, transfer);
    return new Promise((resolve, reject) => {
      this.resolveMap[messageId] = { resolve, reject };
    });
  }
}
