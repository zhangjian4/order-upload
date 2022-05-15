/* eslint-disable @typescript-eslint/member-ordering */
import cv, { Mat, Point, Rect, Size } from 'opencv-ts';
import * as jpeg from 'jpeg-js';
import { Log } from '../../shared/decorator/debug';
import { base64ToArrayBuffer } from '../../shared/util/buffer.util';
import { Point as MyPoint } from '../model';
import writeFile from 'capacitor-blob-writer';
import { Directory } from '@capacitor/filesystem';
// declare let cv;
const initPromise = new Promise<void>((resolve) => {
  cv.onRuntimeInitialized = resolve;
});

declare const OCRAD;

export class OpenCVServiceImpl {
  init() {
    return initPromise;
  }

  matFromImageData(imageData: ImageData) {
    return cv.matFromImageData(imageData);
  }

  isMat(src: any) {
    return src instanceof cv.Mat;
  }

  @Log()
  imageDataFromMat(mat: Mat) {
    // converts the mat type to cv.CV_8U
    const img = new cv.Mat();
    const depth = mat.type() % 8;
    const scale =
      depth <= cv.CV_8S ? 1.0 : depth <= cv.CV_32S ? 1.0 / 256.0 : 255.0;
    const shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128.0 : 0.0;
    mat.convertTo(img, cv.CV_8U, scale, shift);

    // converts the img type to cv.CV_8UC4
    switch (img.type()) {
      case cv.CV_8UC1:
        cv.cvtColor(img, img, cv.COLOR_GRAY2RGBA);
        break;
      case cv.CV_8UC3:
        cv.cvtColor(img, img, cv.COLOR_RGB2RGBA);
        break;
      case cv.CV_8UC4:
        break;
      default:
        throw new Error(
          'Bad number of channels (Source image must have 1, 3 or 4 channels)'
        );
    }
    const imageData = new ImageData(
      new Uint8ClampedArray(img.data),
      img.cols,
      img.rows
    );
    // mat.delete();
    img.delete();
    return imageData;
  }

  jpegFromMat(mat: Mat) {
    const imageData = this.imageDataFromMat(mat);
    const jpegData = jpeg.encode(imageData, 100);
    return jpegData.data.buffer;
  }

  @Log()
  rotate(src: Mat, angle: 0 | 90 | 180 | 270) {
    switch (angle) {
      case 90:
        cv.transpose(src, src);
        cv.flip(src, src, 0);
        break;
      case 180:
        cv.flip(src, src, -1);
        break;
      case 270:
        cv.transpose(src, src);
        cv.flip(src, src, 1);
        break;
    }
    return src;
  }

  @Log()
  resizeImg(image: Mat, radio: number) {
    const dst = new cv.Mat();
    const dsize = new cv.Size(
      Math.round(image.cols * radio),
      Math.round(image.rows * radio)
    );
    cv.resize(image, dst, dsize, 0, 0, cv.INTER_AREA);
    return dst;
  }

  /**
   * 滤波，去噪点
   *
   * @param image
   * @returns
   */
  @Log()
  blur(image: Mat) {
    const dst1 = new cv.Mat();
    cv.cvtColor(image, dst1, cv.COLOR_RGBA2GRAY, 0);
    const dst = new cv.Mat();
    // 高斯模糊
    cv.GaussianBlur(dst1, dst, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    dst1.delete();
    // 中值滤波
    // cv.medianBlur(image, dst, 1);
    // 双边滤波
    // cv.cvtColor(image, image, cv.COLOR_RGBA2RGB, 0);
    // cv.bilateralFilter(image, dst, 9, 75, 75, cv.BORDER_DEFAULT);
    return dst;
  }
  @Log()
  sharpen(src: Mat) {
    const dst = new cv.Mat();
    const array = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    const kernel = cv.matFromArray(3, 3, cv.CV_32FC1, array);
    // You can try more different parameters
    cv.filter2D(
      src,
      dst,
      src.depth(),
      kernel,
      new cv.Point(-1, -1),
      0,
      cv.BORDER_DEFAULT
    );
    kernel.delete();
    return dst;
  }
  @Log()
  getCanny(image: Mat) {
    // 灰度
    // const dst1 = new cv.Mat();
    // cv.cvtColor(image, dst1, cv.COLOR_RGBA2GRAY, 0);
    // const dst2 = new cv.Mat();
    // 高斯模糊
    // cv.GaussianBlur(image, dst2, new cv.Size(3, 3), 2, 2, cv.BORDER_DEFAULT);
    // 中值滤波
    // cv.medianBlur(image, dst2, 1);
    // 双边滤波
    // cv.cvtColor(image, image, cv.COLOR_RGBA2RGB, 0);
    // cv.bilateralFilter(image, dst2, 5, 75, 75, cv.BORDER_DEFAULT);
    // cv.imshow('canvasOutput0', dst2);
    // dst1.delete();
    const dst = new cv.Mat();
    // 边缘检测
    cv.Canny(image, dst, 25, 100);
    // dst2.delete();
    // const dst4 = new cv.Mat();
    const kernel = new cv.Mat.ones(3, 3, cv.CV_8U);
    const anchor = new cv.Point(-1, -1);
    // 膨胀操作，尽量使边缘闭合
    cv.dilate(
      dst,
      dst,
      kernel,
      anchor,
      3,
      cv.BORDER_CONSTANT,
      cv.morphologyDefaultBorderValue()
    );
    kernel.delete();
    return dst;
  }

  /**
   * 求出面积最大的轮廓
   *
   * @param image
   * @returns
   */
  @Log()
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
    // let maxContour: Mat = null;
    const counterArray = [];
    const areaMap = new WeakMap<Mat, number>();
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const rect = cv.boundingRect(contour);
      // const area = cv.contourArea(contour);
      const area = rect.width * rect.height;
      // areas.push(area);
      counterArray.push(contour);
      areaMap.set(contour, area);
      // if (area > maxArea) {
      //   maxArea = area;
      //   maxContour = contour;
      // }
    }
    counterArray.sort((c1, c2) => areaMap.get(c2) - areaMap.get(c1));
    contours.delete();
    hierarchy.delete();
    counterArray.slice(5).forEach((counter) => counter.delete());
    return counterArray.slice(0, 5);
  }

  /**
   * 多边形拟合凸包的四个顶点
   *
   * @param contour
   * @returns
   */
  @Log()
  getBoxPoint(contours: Mat[], center: MyPoint) {
    let matchPoints: Point[];
    for (const contour of contours) {
      const hull = new cv.Mat();
      // 多边形拟合凸包
      cv.convexHull(contour, hull);
      // 输出的精度，就是另个轮廓点之间最大距离数，根据周长来计算
      const epsilon = 0.03 * cv.arcLength(contour, true);
      const approx = new cv.Mat();
      // 多边形拟合
      try {
        cv.approxPolyDP(hull, approx, epsilon, true);
        if (approx.rows === 4) {
          const points: Point[] = [];
          for (let i = 0; i < approx.rows; ++i) {
            const point = new cv.Point(
              approx.data32S[i * 2],
              approx.data32S[i * 2 + 1]
            );
            points.push(point);
          }
          // 图片中心如果在四边形内部直接返回,如果不在内部先待定
          if (this.isPointInRect(points, center)) {
            return points;
          } else if (matchPoints == null) {
            matchPoints = points;
          }
        }
      } finally {
        hull.delete();
        approx.delete();
      }
    }
    return matchPoints;
  }

  isPointInRect(points: MyPoint[], center: MyPoint) {
    const [A, B, C, D] = points;
    const { x, y } = center;
    const a = (B.x - A.x) * (y - A.y) - (B.y - A.y) * (x - A.x);
    const b = (C.x - B.x) * (y - B.y) - (C.y - B.y) * (x - B.x);
    const c = (D.x - C.x) * (y - C.y) - (D.y - C.y) * (x - C.x);
    const d = (A.x - D.x) * (y - D.y) - (A.y - D.y) * (x - D.x);
    return (
      (a > 0 && b > 0 && c > 0 && d > 0) || (a < 0 && b < 0 && c < 0 && d < 0)
    );
  }

  @Log()
  warpImage(src: Mat, points: MyPoint[]) {
    const cols = src.cols;
    points = points.map((point) => ({
      x: Math.round(point.x * cols),
      y: Math.round(point.y * cols),
    }));
    points = this.orderPoints(points);
    const [p0, p1, p2, p3] = points;
    const width1 = this.getDistance(p0, p1);
    const width2 = this.getDistance(p2, p3);
    const height1 = this.getDistance(p1, p2);
    const height2 = this.getDistance(p3, p0);
    const width = Math.round(Math.max(width1, width2));
    const height = Math.round(
      Math.max(height1, height2) + Math.abs(width1 - width2) / 2
    );
    const srcArray = [];
    points.forEach((point) => {
      srcArray.push(point.x, point.y);
    });
    const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, srcArray);
    const dstArray = [0, 0, width, 0, width, height, 0, height];
    const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, dstArray);
    const dst = new cv.Mat();
    const dsize = new cv.Size(width, height);
    const M = cv.getPerspectiveTransform(srcTri, dstTri, cv.DECOMP_LU);
    srcTri.delete();
    dstTri.delete();
    cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT);
    M.delete();
    return dst;
  }
  @Log()
  orderPoints(points: MyPoint[]): MyPoint[] {
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

  getDistance(point1: MyPoint, point2: MyPoint) {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
    );
  }

  /**
   * 提取红色
   *
   * @param src
   * @returns
   */
  @Log()
  extractColor(src: Mat) {
    // const dst = new cv.Mat(src.rows, src.cols, src.type());
    // const hsv = new cv.Mat();
    // cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
    // cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);
    // for (let row = 0; row < hsv.rows; row++) {
    //   for (let col = 0; col < hsv.cols; col++) {
    //     const s_hsv = hsv.ucharPtr(row, col);
    //     if (
    //       !(
    //         ((s_hsv[0] >= 0 && s_hsv[0] <= 15) ||
    //           (s_hsv[0] >= 125 && s_hsv[0] <= 180)) &&
    //         s_hsv[2] >= 46 &&
    //         s_hsv[1] >= 43
    //       )
    //     ) {
    //       s_hsv[0] = 0;
    //       s_hsv[1] = 0;
    //       s_hsv[2] = 0;
    //     }
    //   }
    // }
    // cv.cvtColor(hsv, hsv, cv.COLOR_HSV2RGB);
    // cv.cvtColor(hsv, hsv, cv.COLOR_RGB2GRAY, 0);
    // cv.threshold(hsv, hsv, 177, 255, cv.THRESH_BINARY);
    // return hsv;
    const dst = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
    const threshold1 = 35;
    // const threshold2 = 20;
    const srcData = src.data;
    let index = 0;
    for (let row = 0; row < src.rows; row++) {
      for (let col = 0; col < src.cols; col++) {
        const r = srcData[index];
        const g = srcData[index + 1];
        const b = srcData[index + 2];
        // const pixel = src.ucharPtr(row, col);
        // const destPixel = dst.ucharPtr(row, col);
        // const [r, g, b, _a] = pixel;
        if (
          r - g > threshold1 &&
          r - b > threshold1 &&
          r - Math.max(g, b) > Math.abs(g - b) * 1.5
        ) {
          dst.ucharPtr(row, col)[0] = 255;
        }
        index += 4;
      }
    }
    // cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY, 0);
    // cv.threshold(dst, dst, 177, 255, cv.THRESH_BINARY);
    return dst;
  }

  /**
   * 获取距离中心最近的矩形
   */
  @Log()
  getCenterRect(src: Mat) {
    const dst1 = new cv.Mat();
    // cv.threshold(dst1, dst1, 177, 255, cv.THRESH_BINARY);
    // 取反色
    // cv.bitwise_not(src, dst1);
    // 膨胀
    const kernel = new cv.Mat.ones(3, 3, cv.CV_8U);
    const anchor = new cv.Point(-1, -1);
    // cv.erode(src, dst1, kernel, anchor, 9, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    cv.dilate(
      src,
      dst1,
      kernel,
      anchor,
      9,
      cv.BORDER_CONSTANT,
      cv.morphologyDefaultBorderValue()
    );
    kernel.delete();
    // cv.imshow('canvasOutput6', dst1);
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      dst1,
      contours,
      hierarchy,
      cv.RETR_CCOMP,
      cv.CHAIN_APPROX_SIMPLE
    );
    hierarchy.delete();
    let minDistance: number;
    let nearestRect = null; // 离中心最近的矩形
    const centerX = src.cols / 2;
    const centerY = src.rows / 2;
    for (let i = 0; i < contours.size(); ++i) {
      const cnt = contours.get(i);
      const rect = cv.boundingRect(cnt);
      const currentArea = cv.contourArea(cnt);
      if (
        currentArea > 1000 &&
        currentArea / (rect.width * rect.height) > 0.5
      ) {
        const dx = Math.abs(rect.x + rect.width / 2 - centerX) / src.cols;
        const dy = Math.abs(rect.y + rect.height / 2 - centerY) / src.rows;
        const distance = Math.max(dx, dy);
        // if (rect.x > centerX) {
        //   distance = rect.x - centerX;
        // } else if (rect.x + rect.width < centerX) {
        //   distance = centerX - (rect.x + rect.width);
        // }
        if (distance && (!minDistance || distance < minDistance)) {
          nearestRect = rect;
          minDistance = distance;
        }
      }
    }
    contours.delete();
    dst1.delete();
    return nearestRect;
  }
  @Log()
  crop(src: Mat, rect: Rect) {
    const dst = new cv.Mat(rect.height, rect.width, cv.CV_8UC1);
    for (let row = 0; row < dst.rows; row++) {
      for (let col = 0; col < dst.cols; col++) {
        const pixel = src.ucharPtr(rect.y + row, rect.x + col);
        const destPixel = dst.ucharPtr(row, col);
        destPixel[0] = pixel[0];
      }
    }
    return dst;
  }
  @Log()
  resizeTo(
    src: Mat,
    { maxHeight, minHeight }: { maxHeight?: number; minHeight?: number }
  ) {
    let dsize: Size;
    if (maxHeight && src.rows > maxHeight) {
      const ratio = maxHeight / src.rows;
      dsize = new cv.Size(
        Math.round(src.cols * ratio),
        Math.round(src.rows * ratio)
      );
    }
    if (minHeight && src.rows < minHeight) {
      // 放大整数倍
      const ratio = Math.ceil(minHeight / src.rows);
      dsize = new cv.Size(src.cols * ratio, src.rows * ratio);
    }
    if (dsize) {
      cv.resize(src, src, dsize, 0, 0, cv.INTER_LINEAR);
    }
  }

  // transform(src: any, points: any[]) {
  //   const dest = this.warpImage(src, points);
  //   const result = this.imageDataFromMat(dest);
  //   src.delete();
  //   dest.delete();
  //   return result;
  // }
  @Log()
  ocr(src: Mat) {
    // const dst1 = new cv.Mat();
    // cv.cvtColor(src, dst1, cv.COLOR_RGBA2GRAY, 0);
    const imageData = this.imageDataFromMat(src);
    // dst1.delete();
    const text = OCRAD(imageData, {
      numeric: true,
    });
    console.log(text);
    const pattern = /\d{4,}/g;
    let match: any;
    let result: string;
    while ((match = pattern.exec(text)) != null) {
      if (match != null) {
        result = match[0];
      }
    }
    return result;
  }

  /**
   * 二值化：将订单号转为黑白，方便ocr识别
   *
   * @param src
   * @returns
   */
  threshold(src: Mat) {
    const dst = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
    cv.adaptiveThreshold(
      src,
      dst,
      255,
      cv.ADAPTIVE_THRESH_MEAN_C,
      cv.THRESH_BINARY,
      49,
      17
    );
    return dst;
  }

  /**
   * 腐蚀后膨胀：去掉订单号因为墨水不足断掉的部分
   *
   * @param src
   * @returns
   */
  morphology(src: Mat) {
    const dst = new cv.Mat();
    const M = (cv.Mat as any).ones(2, 2, cv.CV_8U);
    const anchor = new cv.Point(-1, -1);
    // You can try more different parameters
    cv.morphologyEx(
      src,
      dst,
      (cv as any).MORPH_OPEN,
      M,
      anchor,
      1,
      cv.BORDER_CONSTANT,
      cv.morphologyDefaultBorderValue()
    );
    M.delete();
    return dst;
  }

  /**
   * 腐蚀后膨胀：去掉订单号因为墨水不足断掉的部分
   *
   * @param src
   * @returns
   */
  // erode(src: Mat) {
  //   const dst = new cv.Mat();
  //   const M = (cv.Mat as any).ones(3, 3, cv.CV_8U);
  //   const anchor = new cv.Point(-1, -1);
  //   // You can try more different parameters
  //   cv.erode(
  //     src,
  //     dst,
  //     M,
  //     anchor,
  //     1,
  //     cv.BORDER_CONSTANT,
  //     cv.morphologyDefaultBorderValue()
  //   );
  //   return dst;
  // }

  // dilate(src: Mat) {
  //   let dst = new cv.Mat();
  //   let M = (cv.Mat as any).ones(3, 3, cv.CV_8U);
  //   let anchor = new cv.Point(-1, -1);
  //   cv.dilate(
  //     src,
  //     dst,
  //     M,
  //     anchor,
  //     1,
  //     cv.BORDER_CONSTANT,
  //     cv.morphologyDefaultBorderValue()
  //   );
  //   M.delete();
  //   return dst;
  // }

  getPaperRect(mat: Mat) {
    const width = mat.cols;
    const height = mat.rows;
    const blur = this.blur(mat);
    // resize.delete();
    // sharpen.delete();
    const canny = this.getCanny(blur);
    blur.delete();
    const contours = this.findMaxContour(canny);
    canny.delete();
    const points = this.getBoxPoint(contours, {
      x: width / 2,
      y: height / 2,
    });
    contours.forEach((contour) => contour.delete());
    if (points != null) {
      points.forEach((point) => {
        point.x = point.x / width;
        point.y = point.y / width;
      });
    }

    return points;
  }

  @Log()
  decodeJpeg(buffer: ArrayBuffer) {
    return jpeg.decode(buffer, { useTArray: true });
  }

  preview(src: string | Mat) {
    let mat: Mat;
    if (typeof src === 'string') {
      const buffer = base64ToArrayBuffer(src);
      const imageData: any = this.decodeJpeg(buffer);
      mat = cv.matFromImageData(imageData);
    } else {
      mat = src;
    }
    try {
      return this.getPaperRect(mat);
    } finally {
      mat.delete();
    }
  }

  async process2(url: string, points: MyPoint[]) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const decode: any = jpeg.decode(buffer, { useTArray: true });
    const mat = this.matFromImageData(decode);
    return await this.process(mat, points);
    // console.log(mat);
  }

  async process(mat: Mat, points: MyPoint[]) {
    const result: any = {};
    // if (mat.rows > mat.cols) {
    //   this.rotate(mat, 90);
    //   result.origin = mat;
    // }
    try {
      if (points == null) {
        const fixedWidth = 800;
        const ratio = fixedWidth / mat.cols;
        const resize = this.resizeImg(mat, ratio);
        try {
          points = this.getPaperRect(resize);
        } finally {
          resize.delete();
        }
      }
      if (points != null) {
        result.rect = points;
        const dest = this.warpImage(mat, points);
        // const dest = await this.opencvService.transform(mat, points);
        result.dest = dest;
        const roi = this.roiOrderNo(dest);
        const threshold = this.threshold(roi);
        roi.delete();
        const morphology = this.morphology(threshold);
        threshold.delete();
        const text = this.ocr(morphology);
        morphology.delete();
        if (text != null && text.length >= 4) {
          result.name = text.substring(text.length - 4);
        }
        // dest.delete();
      }
    } finally {
      mat.delete();
    }

    // const ratio = 800 / mat.cols;
    // const resize = this.resizeImg(mat, ratio);
    // try {
    //   // const sharpen = this.sharpen(resize);
    //   const blur = this.blur(resize);
    //   // sharpen.delete();
    //   const canny = this.getCanny(blur);
    //   blur.delete();
    //   const contours = this.findMaxContour(canny);
    //   canny.delete();
    //   points = this.getBoxPoint(contours, ratio);
    //   contours.forEach((contour) => contour.delete());
    //   if (points != null) {
    //     const dest = this.warpImage(mat, points);
    //     // const dest = await this.opencvService.transform(mat, points);
    //     result.rect = points;
    //     result.dest = dest;
    //     const roi = this.roiOrderNo(dest);
    //     const threshold = this.threshold(roi);
    //     roi.delete();
    //     const text = this.ocr(threshold);
    //     threshold.delete();
    //     if (text != null && text.length >= 4) {
    //       result.name = text.substring(text.length - 4);
    //     }
    //     // dest.delete();
    //   }
    // } catch (e) {
    //   console.error(e);
    // } finally {
    //   resize.delete();
    // }
    // mat.delete();
    // const dst1 = this.extractColor(mat);
    // try {
    //   const rect = this.getCenterRect(dst1);
    //   if (rect) {
    //     const dst2 = this.crop(dst1, rect);
    //     this.resizeTo(dst2, { minHeight: 50 });
    //     cv.bitwise_not(dst2, dst2);
    //     const text = this.ocr(dst2);
    //     if (text && text.length === 7) {
    //       result.name = text.substr(3, 7);
    //     }
    //     dst2.delete();
    //   }
    // } catch (e) {
    //   console.error(e);
    // } finally {
    //   dst1.delete();
    // }
    return result;
    // const keys = Object.keys(changes);
    // if (keys.length) {
    //   await this.database.preuploadFile.update(item.id, changes);
    //   keys.forEach((key) => {
    //     item[key] = changes[key];
    //   });
    // }
  }

  debug(src: Mat) {
    const result = [];

    try {
      const fixedWidth = 800;
      const ratio = fixedWidth / src.cols;
      const resize = this.resizeImg(src, ratio);
      // const sharpen = this.sharpen(resize);
      // result.push(sharpen);
      const blur = this.blur(resize);
      result.push(blur);
      const canny = this.getCanny(blur);
      result.push(canny);
      const contours = this.findMaxContour(canny);
      result.push(this.showMaxContour(resize, contours));
      const points = this.getBoxPoint(contours, {
        x: fixedWidth / 2,
        y: (src.rows * ratio) / 2,
      });
      contours.forEach((contour) => contour.delete());
      if (points != null) {
        if (points != null) {
          points.forEach((point) => {
            point.x = point.x / fixedWidth;
            point.y = point.y / fixedWidth;
          });
        }
        result.push(this.showPoints(src, points));
        const dst = this.warpImage(src, points);
        result.push(dst);
        const roi = this.roiOrderNo(dst);
        result.push(roi);
        const threshold = this.threshold(roi);
        result.push(threshold);
        const morphology = this.morphology(threshold);
        result.push(morphology);
        // const erode = this.erode(threshold);
        // result.push(erode);
        // const dilate = this.dilate(erode);
        // result.push(dilate);
        const text = this.ocr(morphology);
        console.log(text);
      }

      // const dst2 = this.extractColor(src);
      // result.push(dst2);
      // const rect = this.getCenterRect(dst2);
      // if (rect) {
      //   const rectangleColor = new cv.Scalar(255, 0, 0);
      //   const dst3 = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
      //   const point1 = new cv.Point(rect.x, rect.y);
      //   const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
      //   cv.rectangle(dst3, point1, point2, rectangleColor, -1);
      //   result.push(dst3);
      //   const dst4 = this.crop(dst2, rect);
      //   this.resizeTo(dst4, { minHeight: 50 });
      //   cv.bitwise_not(dst4, dst4);
      //   result.push(dst4);
      //   const text = this.ocr(dst);
      //   console.log(text);
      // }

      resize.delete();
      src.delete();
    } catch (e) {
      console.error(e);
    }
    return result;
  }

  roiOrderNo(src: Mat) {
    // You can try more different parameters
    const rows = src.rows;
    const cols = src.cols;
    const x = Math.floor(cols * 0.75);
    const y = Math.floor(rows * 0.18);
    const width = Math.floor(cols * 0.98) - x;
    const height = Math.floor(rows * 0.13);
    const rect = new cv.Rect(x, y, width, height);
    const dst = src.roi(rect);
    return dst;
  }

  showMaxContour(src: Mat, contours: Mat[]) {
    const dst = src.clone();
    contours.forEach((contour) => {
      const v = new cv.MatVector();
      v.push_back(contour);
      const color = new cv.Scalar(255, 0, 0);
      const hierarchy = new cv.Mat();
      cv.drawContours(dst, v, 0, color, 1, cv.LINE_8, hierarchy, 100);
      hierarchy.delete();
      v.delete();
    });
    return dst;
  }

  showPoints(src: Mat, points: Point[]) {
    const dst = src.clone();
    const cols = src.cols;
    const color = new cv.Scalar(255, 0, 0);
    points.forEach((point) => {
      cv.circle(dst, new cv.Point(point.x * cols, point.y * cols), 5, color, 2);
    });
    // for (let i = 0; i < approx.rows; ++i) {
    //   const point = new cv.Point(
    //     approx.data32S[i * 2],
    //     approx.data32S[i * 2 + 1]
    //   );
    //   cv.circle(dst, point, 5, color, 2);
    // }
    return dst;
  }
  // fromImageData(imageData: ImageData) {
  //   const mat = cv.matFromImageData(imageData);
  //   console.log(mat);
  //   return mat;
  // }
}
