/* eslint-disable @typescript-eslint/member-ordering */
/// <reference lib="webworker" />

import { OpenCVServiceImpl } from '../core/service/opencv-impl.service';
import * as jpeg from 'jpeg-js';

self.importScripts('/assets/js/ocrad.js');
(self as any).Buffer = {
  from: (bytes: any[]) => new Uint8Array(bytes),
};
const openCVService = new OpenCVServiceImpl();

self.addEventListener(
  'message',
  async (event: MessageEvent) => {
    const { messageId, args, method: m } = event.data;
    const result: any = { messageId };
    const mats = [];
    const transfer = [];
    try {
      await openCVService.init();
      const params = args.map((arg: any) => {
        if (arg instanceof ArrayBuffer) {
          const decode: any = jpeg.decode(arg, { useTArray: true });
          const mat = openCVService.matFromImageData(decode);
          mats.push(mat);
          return mat;
        } else if (arg instanceof ImageData) {
          const mat = openCVService.matFromImageData(arg);
          mats.push(mat);
          return mat;
        } else {
          return arg;
        }
      });
      let data = await openCVService[m].apply(openCVService, params);
      // let data = await openCVService[m](...params);
      if (data) {
        if (openCVService.isMat(data)) {
          const imageData = openCVService.jpegFromMat(data);
          data.delete();
          transfer.push(imageData);
          data = imageData;
        } else if (Array.isArray(data)) {
          data.forEach((item, i) => {
            if (openCVService.isMat(item)) {
              const imageData = openCVService.jpegFromMat(item);
              item.delete();
              transfer.push(imageData);
              data[i] = imageData;
            }
          });
        } else if (typeof data === 'object') {
          Object.keys(data).forEach((key) => {
            const item = data[key];
            if (openCVService.isMat(item)) {
              const imageData = openCVService.jpegFromMat(item);
              item.delete();
              transfer.push(imageData);
              data[key] = imageData;
            }
          });
        }
      }
      result.success = true;
      result.data = data;
    } catch (e) {
      console.error(e);
      result.success = false;
      result.error = e;
    } finally {
      mats.forEach((mat) => {
        if (!mat.isDeleted()) {
          mat.delete();
        }
      });
    }
    self.postMessage(result);
  },
  false
);
