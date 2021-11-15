/* eslint-disable @typescript-eslint/member-ordering */
/// <reference lib="webworker" />

import cv, { Mat, Point, Rect, Size } from 'opencv-ts/src/opencv';
import { Log } from '../shared/decorator/debug';
// declare let cv;
const initPromise = new Promise<void>((resolve) => {
  cv.onRuntimeInitialized = resolve;
});
self.importScripts('/assets/js/ocrad.js');
declare const OCRAD;

class OpenCVService {
  init() {
    return initPromise;
  }

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
    const clampedArray = new ImageData(
      new Uint8ClampedArray(img.data),
      img.cols,
      img.rows
    );
    // mat.delete();
    img.delete();
    return clampedArray;
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
    const dst = new cv.Mat();
    // 高斯模糊
    cv.GaussianBlur(image, dst, new cv.Size(3, 3), 2, 2, cv.BORDER_DEFAULT);
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
    cv.Canny(image, dst, 50, 200);
    // dst2.delete();
    // const dst4 = new cv.Mat();
    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
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
    // dst3.delete();
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
    let maxArea = 0.0;
    let maxContour: Mat = null;
    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i);
      const rect = cv.boundingRect(contour);
      const currentArea = rect.width * rect.height;
      // const currentArea = cv.contourArea(contour);
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
  @Log()
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
  }
  @Log()
  warpImage(src: Mat, points: Point[]) {
    points = this.orderPoints(points);
    const [p0, p1, p2, p3] = points;
    const width = Math.round(
      Math.max(this.getDistance(p0, p1), this.getDistance(p2, p3))
    );
    const height = Math.round(
      Math.max(this.getDistance(p1, p2), this.getDistance(p3, p0))
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

  getDistance(point1: Point, point2: Point) {
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
    const dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
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
    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
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
    const imageData = this.imageDataFromMat(src);
    let text = OCRAD(imageData, {
      numeric: true,
    });
    text = text.trim();
    console.log(text);
    return text;
  }

  async process(mat: Mat) {
    const result: any = {};
    if (mat.rows > mat.cols) {
      this.rotate(mat, 90);
      result.origin = mat;
    }
    const ratio = 900 / mat.cols;
    const resize = this.resizeImg(mat, ratio);
    try {
      const sharpen = this.sharpen(resize);
      const blur = this.blur(sharpen);
      sharpen.delete();
      const canny = this.getCanny(blur);
      blur.delete();
      const maxContour = this.findMaxContour(canny);
      canny.delete();
      const points = this.getBoxPoint(maxContour, ratio);
      maxContour.delete();
      if (points.length === 4) {
        const dest = this.warpImage(mat, points);
        // const dest = await this.opencvService.transform(mat, points);
        result.rect = points;
        result.dest = dest;
        // dest.delete();
      }
    } catch (e) {
      console.error(e);
    }
    // mat.delete();
    const dst1 = this.extractColor(mat);
    resize.delete();
    try {
      const rect = this.getCenterRect(dst1);
      if (rect) {
        const dst2 = this.crop(dst1, rect);
        this.resizeTo(dst2, { minHeight: 50 });
        cv.bitwise_not(dst2, dst2);
        const text = this.ocr(dst2);
        if (text && text.length === 7) {
          result.name = text.substr(3, 7);
        }
        dst2.delete();
      }
    } catch (e) {
      console.error(e);
    } finally {
      dst1.delete();
    }
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
      if (src.rows > src.cols) {
        this.rotate(src, 90);
      }
      const ratio = 900 / src.cols;
      const resize = this.resizeImg(src, ratio);
      const sharpen = this.sharpen(resize);
      result.push(sharpen);
      const blur = this.blur(sharpen);
      result.push(blur);
      const canny = this.getCanny(blur);
      result.push(canny);
      const maxContour = this.findMaxContour(canny);
      result.push(this.showMaxContour(resize, maxContour));
      let points = this.getBoxPoint(maxContour, ratio);
      maxContour.delete();
      if (points.length !== 4) {
        points = [
          new cv.Point(0, 0),
          new cv.Point(src.cols, 0),
          new cv.Point(src.cols, src.rows),
          new cv.Point(0, src.rows),
        ];
      }
      result.push(this.showPoints(src, points));
      const dst = this.warpImage(src, points);
      result.push(dst);
      const dst2 = this.extractColor(src);
      result.push(dst2);
      const rect = this.getCenterRect(dst2);
      if (rect) {
        const rectangleColor = new cv.Scalar(255, 0, 0);
        const dst3 = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
        const point1 = new cv.Point(rect.x, rect.y);
        const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
        cv.rectangle(dst3, point1, point2, rectangleColor, -1);
        result.push(dst3);
        const dst4 = this.crop(dst2, rect);
        this.resizeTo(dst4, { minHeight: 50 });
        cv.bitwise_not(dst4, dst4);
        result.push(dst4);
        const text = this.ocr(dst4);
        console.log(text);
      }

      resize.delete();
      src.delete();
    } catch (e) {
      console.error(e);
    }
    return result;
  }

  showMaxContour(src: Mat, maxContour: Mat) {
    const contours = new cv.MatVector();
    contours.push_back(maxContour);
    const color = new cv.Scalar(255, 0, 0);
    const dst = src.clone();
    const hierarchy = new cv.Mat();
    cv.drawContours(dst, contours, 0, color, 1, cv.LINE_8, hierarchy, 100);
    hierarchy.delete();
    contours.delete();
    return dst;
  }

  showPoints(src: Mat, points: Point[]) {
    const dst = src.clone();
    const color = new cv.Scalar(255, 0, 0);
    points.forEach((point) => {
      cv.circle(dst, point, 5, color, 2);
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

const openCVService = new OpenCVService();

self.addEventListener(
  'message',
  async (event: MessageEvent) => {
    const { messageId, args, method: m } = event.data;
    const result: any = { messageId };
    const mats = [];
    const transfer = [];
    try {
      await openCVService.init();
      const start = new Date().getTime();
      const params = args.map((arg) => {
        if (arg instanceof ImageData) {
          const mat = cv.matFromImageData(arg);
          mats.push(mat);
          return mat;
        } else {
          return arg;
        }
      });
      let data = await openCVService[m](...params);
      if (data) {
        if (data instanceof cv.Mat) {
          const imageData = openCVService.imageDataFromMat(data);
          data.delete();
          transfer.push(imageData.data.buffer);
          data = imageData;
        } else if (Array.isArray(data)) {
          data.forEach((item, i) => {
            if (item instanceof cv.Mat) {
              const imageData = openCVService.imageDataFromMat(item);
              item.delete();
              transfer.push(imageData.data.buffer);
              data[i] = imageData;
            }
          });
        } else if (typeof data === 'object') {
          Object.keys(data).forEach((key) => {
            const item = data[key];
            if (item instanceof cv.Mat) {
              const imageData = openCVService.imageDataFromMat(item);
              item.delete();
              transfer.push(imageData.data.buffer);
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
