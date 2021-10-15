// import cv from 'opencv-ts';
// declare const cv: any;
declare let cv;

class OpenCVService {
  private initPromise: Promise<void>;

  init() {
    if (!this.initPromise) {
      this.initPromise = new Promise((resolve) => {
        self.importScripts('/assets/js/opencv.js');
        cv = cv();
        cv.onRuntimeInitialized = resolve;
      });
    }
    return this.initPromise;
  }

  fromImageData(imageData: ImageData) {
    const mat = cv.matFromImageData(imageData);
    console.log(mat);
    return mat;
  }
}

const openCVService = new OpenCVService();

self.addEventListener(
  'message',
  async (e: MessageEvent) => {
    console.log(e);
    const data = e.data;
    const method = openCVService[data.method];
    if (method) {
      let result = await method(...data.args);
      const transfers = [];
      if (result instanceof cv.Mat) {
        result = result.data;
        transfers.push(result.buffer);
      }
      console.log(123);
      self.postMessage({ messageId: data.messageId, result }, transfers);
    }
  },
  false
);
