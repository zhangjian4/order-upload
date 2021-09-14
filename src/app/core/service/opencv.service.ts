import { Injectable } from '@angular/core';
import { LazyService } from './lazy.service';
import cv, { Mat, Point, Rect } from 'opencv-ts';
import { loadImage } from 'src/app/shared/util/image.util';

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
    const dst1 = new cv.Mat();
    // 灰度
    cv.cvtColor(image, dst1, cv.COLOR_RGBA2GRAY, 0);
    const dst2 = new cv.Mat();
    // 高斯模糊
    cv.GaussianBlur(dst1, dst2, new cv.Size(3, 3), 2, 2, cv.BORDER_DEFAULT);
    dst1.delete();
    const dst3 = new cv.Mat();
    // 边缘检测
    cv.Canny(dst2, dst3, 60, 240);
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
    dst3.delete();
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
  getBoxPoint(contour: Mat) {
    const hull = new cv.Mat();
    // 多边形拟合凸包
    cv.convexHull(contour, hull);
    // 输出的精度，就是另个轮廓点之间最大距离数，根据周长来计算
    const epsilon = 0.03 * cv.arcLength(contour, true);
    const approx = new cv.Mat();
    // 多边形拟合
    cv.approxPolyDP(hull, approx, epsilon, true);
    hull.delete();
    return approx;
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

  getDistance(contour: number[], index1: number, index2: number) {
    return Math.sqrt(
      Math.pow(contour[index1 * 2] - contour[index2 * 2], 2) +
        Math.pow(contour[index1 * 2 + 1] - contour[index2 * 2 + 1], 2)
    );
  }

  warpImage(src: Mat, points: Mat, ratio: number) {
    let data = points.data32S;
    if (ratio !== 1) {
      data = data.map((value) => Math.round(value / ratio));
    }
    const width = Math.round(
      Math.max(this.getDistance(data, 0, 1), this.getDistance(data, 2, 3))
    );
    const height = Math.round(
      Math.max(this.getDistance(data, 1, 2), this.getDistance(data, 3, 0))
    );
    const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, data);
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
}
