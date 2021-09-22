import { Injectable } from '@angular/core';
import { LazyService } from './lazy.service';
import cv, { Mat, Point, Rect } from 'opencv-ts';
import {
  base64ToBlob,
  canvasToBlob,
  loadImage,
} from 'src/app/shared/util/image.util';

// declare const cv: any;

@Injectable({ providedIn: 'root' })
export class OpenCVService {
  private initPromise: Promise<void>;
  constructor() {
    this.initPromise = new Promise<void>((resolve) => {
      (cv as any).then(() => {
        resolve();
      });
    });
  }

  init() {
    return this.initPromise;
  }

  async fromBlob(blob: Blob) {
    const url = URL.createObjectURL(blob);
    try {
      const image = await loadImage(url);
      const src = cv.imread(image);
      return src;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * 固定尺寸
   *
   * @param image
   * @param height
   * @returns
   */
  resizeImg(image: Mat, radio: number) {
    console.log(image.cols, image.rows);
    const dst = new cv.Mat();
    const dsize = new cv.Size(
      Math.round(image.cols * radio),
      Math.round(image.rows * radio)
    );
    cv.resize(image, dst, dsize, 0, 0, cv.INTER_AREA);
    return dst;
    // h, w = image.shape[:2]
    // pro = height / h
    // size = (int(w * pro), int(height))
    // img = cv2.resize(image, size)
    // return img
  }

  /**
   * 边缘检测
   *
   * @param image
   * @returns
   */
  getCanny(image: Mat) {
    // 灰度
    // const dst1 = new cv.Mat();
    // cv.cvtColor(image, dst1, cv.COLOR_RGBA2GRAY, 0);
    const dst2 = new cv.Mat();
    // 高斯模糊
    // cv.GaussianBlur(image, dst2, new cv.Size(3, 3), 2, 2, cv.BORDER_DEFAULT);
    // 中值滤波
    cv.medianBlur(image, dst2, 5);
    // 双边滤波
    // cv.cvtColor(image, image, cv.COLOR_RGBA2RGB, 0);
    // cv.bilateralFilter(image, dst2, 9, 75, 75, cv.BORDER_DEFAULT);
    // cv.imshow('canvasOutput0', dst2);
    // dst1.delete();
    const dst3 = new cv.Mat();
    // 边缘检测
    cv.Canny(dst2, dst3, 100, 300);
    dst2.delete();
    const dst4 = new cv.Mat();
    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    const anchor = new cv.Point(-1, -1);
    // 膨胀操作，尽量使边缘闭合
    cv.dilate(
      dst3,
      dst4,
      kernel,
      anchor,
      1,
      cv.BORDER_CONSTANT,
      cv.morphologyDefaultBorderValue()
    );
    kernel.delete();
    // dst3.delete();
    return dst4;
  }

  /**
   * 求出面积最大的轮廓
   *
   * @param image
   * @returns
   */
  findMaxContour(image: Mat) {
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      image,
      contours,
      hierarchy,
      cv.RETR_CCOMP,
      cv.CHAIN_APPROX_SIMPLE
    );
    let maxArea = 0.0;
    let maxContour = null;
    for (let i = 0; i < contours.size(); ++i) {
      const contour = contours.get(i);
      const currentArea = cv.contourArea(contour);
      if (currentArea > maxArea) {
        maxArea = currentArea;
        maxContour = contour;
      }
    }
    contours.delete();
    hierarchy.delete();
    return maxContour;
  }

  /**
   * 多边形拟合凸包的四个顶点
   *
   * @param contour
   * @returns
   */
  getBoxPoint(contour: Mat, ratio: number) {
    const hull = new cv.Mat();
    // 多边形拟合凸包
    cv.convexHull(contour, hull);
    // 输出的精度，就是另个轮廓点之间最大距离数，根据周长来计算
    const epsilon = 0.03 * cv.arcLength(contour, true);
    const approx = new cv.Mat();
    // 多边形拟合
    cv.approxPolyDP(hull, approx, epsilon, true);
    hull.delete();
    // return approx;
    const points: Point[] = [];
    for (let i = 0; i < approx.rows; ++i) {
      const point = new cv.Point(
        approx.data32S[i * 2] / ratio,
        approx.data32S[i * 2 + 1] / ratio
      );
      points.push(point);
    }
    approx.delete();
    return points;
    // const points: Point[] = [];
    // for (let i = 0; i < approx.rows; ++i) {
    //   const point = new cv.Point(
    //     approx.data32S[i * 2],
    //     approx.data32S[i * 2 + 1]
    //   );
    //   console.log(point);
    //   points.push(point);
    // }
    // return points;
  }

  // getDistance(contour: number[], index1: number, index2: number) {
  //   return Math.sqrt(
  //     Math.pow(contour[index1 * 2] - contour[index2 * 2], 2) +
  //       Math.pow(contour[index1 * 2 + 1] - contour[index2 * 2 + 1], 2)
  //   );
  // }

  getDistance(point1: Point, point2: Point) {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
    );
  }

  warpImage(src: Mat, points: Point[]) {
    // let data = points.data32S;
    // if (ratio !== 1) {
    //   data = data.map((value) => Math.round(value / ratio));
    // }
    // const width = Math.round(
    //   Math.max(this.getDistance(data, 0, 1), this.getDistance(data, 2, 3))
    // );
    // const height = Math.round(
    //   Math.max(this.getDistance(data, 1, 2), this.getDistance(data, 3, 0))
    // );
    points = this.orderPoints(points);
    const width = Math.round(
      Math.max(
        this.getDistance(points[0], points[1]),
        this.getDistance(points[2], points[3])
      )
    );
    const height = Math.round(
      Math.max(
        this.getDistance(points[1], points[2]),
        this.getDistance(points[3], points[0])
      )
    );
    const srcArray = [];
    points.forEach((point) => {
      srcArray.push(point.x, point.y);
    });
    const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, srcArray);
    const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0,
      0,
      width,
      0,
      width,
      height,
      0,
      height,
    ]);
    const dst = new cv.Mat();
    const dsize = new cv.Size(width, height);
    const M: Mat = cv.getPerspectiveTransform(
      srcTri,
      dstTri,
      cv.DECOMP_LU
    ) as any;
    srcTri.delete();
    dstTri.delete();
    cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT);
    M.delete();
    return dst;
  }
  orderPoints(points: Point[]): Point[] {
    // 找出离左上角最近的点作为第一个点
    let firstIndex: number;
    let min: number;
    points.forEach((point, i) => {
      const sum = point.x + point.y;
      if (min == null || sum < min) {
        min = sum;
        firstIndex = i;
      }
    });
    if (firstIndex === 0) {
      return points;
    } else {
      return points
        .slice(firstIndex, points.length)
        .concat(points.slice(0, firstIndex));
    }
  }

  async getPagerRect(src: Blob | Mat) {
    await this.init();
    if (src instanceof Blob) {
      src = await this.fromBlob(src as Blob);
    }
    let ratio = 1;
    if (src.rows > 900) {
      ratio = 900 / src.rows;
    }
    const resize = this.resizeImg(src, ratio);
    const canny = this.getCanny(resize);
    resize.delete();
    const maxContour = this.findMaxContour(canny);
    canny.delete();
    const points = this.getBoxPoint(maxContour, ratio);
    maxContour.delete();
    return points;
  }

  async transform(src: Blob | Mat, points: Point[]) {
    if (src instanceof Blob) {
      src = await this.fromBlob(src as Blob);
    }
    const dst = this.warpImage(src, points);
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, dst);
    const result = await canvasToBlob(canvas);
    // let base64 = canvas.toDataURL('image/jpeg');
    // base64 = base64.substr(base64.indexOf(',') + 1);
    // const result = base64ToBlob(base64);
    dst.delete();
    return result;
  }
}
