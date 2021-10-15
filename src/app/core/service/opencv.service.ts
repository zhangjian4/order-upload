import { Injectable } from '@angular/core';
import {
  base64ToBlob,
  canvasToBlob,
  imageToImageData,
  loadImage,
} from 'src/app/shared/util/image.util';
// import { OcradService } from './ocrad.service';

@Injectable({ providedIn: 'root' })
export class OpenCVService {
  worker: Worker;
  private messageId = 0;
  private initPromise: Promise<void>;
  private resolveMap = {};
  constructor() {
    this.worker = new Worker('/assets/js/opencv.worker.js');
    this.worker.onmessage = (event: MessageEvent) => {
      const result = event.data;
      const resolve = this.resolveMap[result.messageId];
      if (resolve) {
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

  async fromBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    try {
      const image = await loadImage(url);
      const imageData = await imageToImageData(image);
      return imageData as any;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  // /**
  //  * 旋转
  //  *
  //  * @param src
  //  * @param angle
  //  */
  // rotate(src: any, angle: 0 | 90 | 180 | 270) {
  //   return this.execute('rotate', src, angle);
  //   // switch (angle) {
  //   //   case 90:
  //   //     cv.transpose(src, src);
  //   //     cv.flip(src, src, 0);
  //   //     break;
  //   //   case 180:
  //   //     cv.flip(src, src, -1);
  //   //     break;
  //   //   case 270:
  //   //     cv.transpose(src, src);
  //   //     cv.flip(src, src, 1);
  //   //     break;
  //   // }
  // }

  // /**
  //  * 固定尺寸
  //  *
  //  * @param image
  //  * @param height
  //  * @returns
  //  */
  // resizeImg(image: any, radio: number) {
  //   return this.execute('resizeImg', image, radio);
  //   // const dst = new cv.Mat();
  //   // const dsize = new cv.Size(
  //   //   Math.round(image.cols * radio),
  //   //   Math.round(image.rows * radio)
  //   // );
  //   // cv.resize(image, dst, dsize, 0, 0, cv.INTER_AREA);
  //   // return dst;
  // }

  // /**
  //  * 边缘检测
  //  *
  //  * @param image
  //  * @returns
  //  */
  // getCanny(image: Mat) {
  //   return this.execute('getCanny', image);
  //   // // 灰度
  //   // // const dst1 = new cv.Mat();
  //   // // cv.cvtColor(image, dst1, cv.COLOR_RGBA2GRAY, 0);
  //   // const dst2 = new cv.Mat();
  //   // // 高斯模糊
  //   // // cv.GaussianBlur(image, dst2, new cv.Size(3, 3), 2, 2, cv.BORDER_DEFAULT);
  //   // // 中值滤波
  //   // cv.medianBlur(image, dst2, 1);
  //   // // 双边滤波
  //   // // cv.cvtColor(image, image, cv.COLOR_RGBA2RGB, 0);
  //   // // cv.bilateralFilter(image, dst2, 9, 75, 75, cv.BORDER_DEFAULT);
  //   // // cv.imshow('canvasOutput0', dst2);
  //   // // dst1.delete();
  //   // const dst3 = new cv.Mat();
  //   // // 边缘检测
  //   // cv.Canny(dst2, dst3, 50, 200);
  //   // dst2.delete();
  //   // const dst4 = new cv.Mat();
  //   // const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  //   // const anchor = new cv.Point(-1, -1);
  //   // // 膨胀操作，尽量使边缘闭合
  //   // cv.dilate(
  //   //   dst3,
  //   //   dst4,
  //   //   kernel,
  //   //   anchor,
  //   //   1,
  //   //   cv.BORDER_CONSTANT,
  //   //   cv.morphologyDefaultBorderValue()
  //   // );
  //   // kernel.delete();
  //   // // dst3.delete();
  //   // return dst4;
  // }

  // /**
  //  * 求出面积最大的轮廓
  //  *
  //  * @param image
  //  * @returns
  //  */
  // findMaxContour(image: Mat) {
  //   const contours = new cv.MatVector();
  //   const hierarchy = new cv.Mat();
  //   cv.findContours(
  //     image,
  //     contours,
  //     hierarchy,
  //     cv.RETR_CCOMP,
  //     cv.CHAIN_APPROX_SIMPLE
  //   );
  //   let maxArea = 0.0;
  //   let maxContour = null;
  //   for (let i = 0; i < contours.size(); ++i) {
  //     const contour = contours.get(i);
  //     const currentArea = cv.contourArea(contour);
  //     if (currentArea > maxArea) {
  //       maxArea = currentArea;
  //       maxContour = contour;
  //     }
  //   }
  //   contours.delete();
  //   hierarchy.delete();
  //   return maxContour;
  // }

  // /**
  //  * 多边形拟合凸包的四个顶点
  //  *
  //  * @param contour
  //  * @returns
  //  */
  // getBoxPoint(contour: Mat, ratio: number) {
  //   const hull = new cv.Mat();
  //   // 多边形拟合凸包
  //   cv.convexHull(contour, hull);
  //   // 输出的精度，就是另个轮廓点之间最大距离数，根据周长来计算
  //   const epsilon = 0.03 * cv.arcLength(contour, true);
  //   const approx = new cv.Mat();
  //   // 多边形拟合
  //   cv.approxPolyDP(hull, approx, epsilon, true);
  //   hull.delete();
  //   // return approx;
  //   const points: Point[] = [];
  //   for (let i = 0; i < approx.rows; ++i) {
  //     const point = new cv.Point(
  //       approx.data32S[i * 2] / ratio,
  //       approx.data32S[i * 2 + 1] / ratio
  //     );
  //     points.push(point);
  //   }
  //   approx.delete();
  //   return points;
  // }

  // getDistance(point1: Point, point2: Point) {
  //   return Math.sqrt(
  //     Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
  //   );
  // }

  // warpImage(src: Mat, points: Point[]) {
  //   points = this.orderPoints(points);
  //   const [p0, p1, p2, p3] = points;
  //   const width = Math.round(
  //     Math.max(this.getDistance(p0, p1), this.getDistance(p2, p3))
  //   );
  //   const height = Math.round(
  //     Math.max(this.getDistance(p1, p2), this.getDistance(p3, p0))
  //   );
  //   const srcArray = [];
  //   points.forEach((point) => {
  //     srcArray.push(point.x, point.y);
  //   });
  //   const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, srcArray);
  //   const dstArray = [0, 0, width, 0, width, height, 0, height];
  //   const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, dstArray);
  //   const dst = new cv.Mat();
  //   const dsize = new cv.Size(width, height);
  //   const M: any = cv.getPerspectiveTransform(srcTri, dstTri, cv.DECOMP_LU);
  //   srcTri.delete();
  //   dstTri.delete();
  //   cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT);
  //   M.delete();
  //   return dst;
  // }
  // orderPoints(points: Point[]): Point[] {
  //   // 找出离左上角最近的点作为第一个点
  //   let firstIndex: number;
  //   let min: number;
  //   points.forEach((point, i) => {
  //     const sum = point.x + point.y;
  //     if (min == null || sum < min) {
  //       min = sum;
  //       firstIndex = i;
  //     }
  //   });
  //   if (firstIndex === 0) {
  //     return points;
  //   } else {
  //     return points
  //       .slice(firstIndex, points.length)
  //       .concat(points.slice(0, firstIndex));
  //   }
  // }

  // async getPagerRect(src: Blob | Mat) {
  //   await this.init();
  //   let mat: Mat;
  //   if (src instanceof Blob) {
  //     mat = await this.fromBlob(src as Blob);
  //   } else {
  //     mat = src;
  //   }
  //   this.rotate(mat, 90);
  //   const ratio = 900 / mat.rows;
  //   const resize = await this.resizeImg(mat, ratio);
  //   const canny = await this.getCanny(resize);
  //   resize.delete();
  //   const maxContour = this.findMaxContour(canny);
  //   canny.delete();
  //   const points = this.getBoxPoint(maxContour, ratio);
  //   maxContour.delete();
  //   if (src instanceof Blob) {
  //     mat.delete();
  //   }
  //   if (points.length === 4) {
  //     return points;
  //   } else {
  //     return null;
  //   }
  // }

  async transform(src: Blob, points: { x: number; y: number }[]) {
    const imageData = await this.fromBlob(src);
    const dst = await this.execute('transform', imageData, points);
    return this.toBlob(dst);
  }

  toCanvas(imageData: ImageData) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  async toBlob(src: ImageData) {
    const canvas = this.toCanvas(src);
    const result = await canvasToBlob(canvas);
    return result;
  }

  // /**
  //  * 提取红色
  //  *
  //  * @param src
  //  * @returns
  //  */
  // extractColor(src: Mat) {
  //   const dst = new cv.Mat(src.rows, src.cols, src.type());
  //   const threshold1 = 20;
  //   // const threshold2 = 20;
  //   for (let row = 0; row < src.rows; row++) {
  //     for (let col = 0; col < src.cols; col++) {
  //       const pixel = src.ucharPtr(row, col);
  //       const destPixel = dst.ucharPtr(row, col);
  //       const [r, g, b, a] = pixel;
  //       if (
  //         r - g > threshold1 &&
  //         r - b > threshold1 &&
  //         r - Math.max(g, b) > Math.abs(g - b) * 1.5
  //       ) {
  //         pixel.forEach((v, i) => {
  //           destPixel[i] = v;
  //         });
  //       } else {
  //         destPixel.fill(255);
  //       }
  //     }
  //   }
  //   cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY, 0);
  //   cv.threshold(dst, dst, 177, 255, cv.THRESH_BINARY);
  //   return dst;
  // }

  // /**
  //  * 获取距离中心最近的矩形
  //  */
  // getCenterRect(src: Mat) {
  //   const dst1 = new cv.Mat();
  //   // 取反色
  //   cv.bitwise_not(src, dst1);
  //   // 膨胀
  //   const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
  //   const anchor = new cv.Point(-1, -1);
  //   cv.dilate(
  //     dst1,
  //     dst1,
  //     kernel,
  //     anchor,
  //     6,
  //     cv.BORDER_CONSTANT,
  //     cv.morphologyDefaultBorderValue()
  //   );
  //   kernel.delete();
  //   // cv.imshow('canvasOutput6', dst1);
  //   const contours = new cv.MatVector();
  //   const hierarchy = new cv.Mat();
  //   cv.findContours(
  //     dst1,
  //     contours,
  //     hierarchy,
  //     cv.RETR_CCOMP,
  //     cv.CHAIN_APPROX_SIMPLE
  //   );
  //   hierarchy.delete();
  //   let minDistance: number;
  //   let nearestRect = null; // 离中心最近的矩形
  //   const centerX = src.cols / 2;
  //   for (let i = 0; i < contours.size(); ++i) {
  //     const cnt = contours.get(i);
  //     const rect = cv.boundingRect(cnt);
  //     const currentArea = cv.contourArea(cnt);
  //     if (
  //       currentArea > 1000 &&
  //       currentArea / (rect.width * rect.height) > 0.5
  //     ) {
  //       let distance: number;
  //       if (rect.x > centerX) {
  //         distance = rect.x - centerX;
  //       } else if (rect.x + rect.width < centerX) {
  //         distance = centerX - (rect.x + rect.width);
  //       }
  //       if (distance && (!minDistance || distance < minDistance)) {
  //         nearestRect = rect;
  //         minDistance = distance;
  //       }
  //     }
  //   }
  //   contours.delete();
  //   dst1.delete();
  //   return nearestRect;
  // }

  // crop(src: Mat, rect: Rect) {
  //   const dst = new cv.Mat(rect.height, rect.width, cv.CV_8UC1);
  //   for (let row = 0; row < dst.rows; row++) {
  //     for (let col = 0; col < dst.cols; col++) {
  //       const pixel = src.ucharPtr(rect.y + row, rect.x + col);
  //       const destPixel = dst.ucharPtr(row, col);
  //       destPixel[0] = pixel[0];
  //     }
  //   }
  //   return dst;
  // }

  // resizeTo(
  //   src: Mat,
  //   { maxHeight, minHeight }: { maxHeight?: number; minHeight?: number }
  // ) {
  //   let dsize: Size;
  //   if (maxHeight && src.rows > maxHeight) {
  //     const ratio = maxHeight / src.rows;
  //     dsize = new cv.Size(
  //       Math.round(src.cols * ratio),
  //       Math.round(src.rows * ratio)
  //     );
  //   }
  //   if (minHeight && src.rows < minHeight) {
  //     // 放大整数倍
  //     const ratio = Math.ceil(minHeight / src.rows);
  //     dsize = new cv.Size(src.cols * ratio, src.rows * ratio);
  //   }
  //   if (dsize) {
  //     cv.resize(src, src, dsize, 0, 0, cv.INTER_LINEAR);
  //   }
  // }

  // async getOrderNo(src: Mat) {
  //   const dst1 = this.extractColor(src);
  //   const rect = this.getCenterRect(dst1);
  //   try {
  //     if (rect) {
  //       const dst2 = this.crop(dst1, rect);
  //       this.resizeTo(dst2, { minHeight: 50 });
  //       const canvas = document.createElement('canvas');
  //       cv.imshow(canvas, dst2);
  //       dst2.delete();
  //       const text = await this.ocradService.execute(canvas, {
  //         numeric: true,
  //       });
  //       return text.trim();
  //     }
  //   } finally {
  //     dst1.delete();
  //   }
  // }

  async process(blob: Blob) {
    const imageData = await this.fromBlob(blob);
    const result = await this.execute('process', imageData);
    if (result.blob) {
      result.blob = await this.toBlob(result.blob);
    }
    if (result.dest) {
      result.dest = await this.toBlob(result.dest);
    }
    return result;
  }
  async debug(blob: Blob) {
    const imageData = await this.fromBlob(blob);
    return this.execute('debug', imageData);
  }
  private execute(method: string, ...args: any[]): Promise<any> {
    const messageId = this.messageId++;
    const transfer = [];
    args.forEach((arg) => {
      if (arg instanceof ImageBitmap) {
        transfer.push(arg);
      }
    });
    this.worker.postMessage({ messageId, method, args }, transfer);
    return new Promise((resolve, reject) => {
      this.resolveMap[messageId] = { resolve, reject };
    });
  }
}
