// import cv from 'opencv-ts';
// declare const cv: any;
declare let cv;
declare const OCRAD;

class OpenCVService {
  private initPromise: Promise<void>;

  init() {
    if (!this.initPromise) {
      this.initPromise = new Promise((resolve) => {
        self.importScripts('/assets/js/opencv.js', '/assets/js/ocrad.js');
        cv = cv();
        cv.onRuntimeInitialized = resolve;
      });
    }
    return this.initPromise;
  }

  imageDataFromMat(mat) {
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

  rotate(src: any, angle: 0 | 90 | 180 | 270) {
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

  resizeImg(image: any, radio: number) {
    const dst = new cv.Mat();
    const dsize = new cv.Size(
      Math.round(image.cols * radio),
      Math.round(image.rows * radio)
    );
    cv.resize(image, dst, dsize, 0, 0, cv.INTER_AREA);
    return dst;
  }
  getCanny(image: any) {
    // 灰度
    // const dst1 = new cv.Mat();
    // cv.cvtColor(image, dst1, cv.COLOR_RGBA2GRAY, 0);
    const dst2 = new cv.Mat();
    // 高斯模糊
    // cv.GaussianBlur(image, dst2, new cv.Size(3, 3), 2, 2, cv.BORDER_DEFAULT);
    // 中值滤波
    cv.medianBlur(image, dst2, 1);
    // 双边滤波
    // cv.cvtColor(image, image, cv.COLOR_RGBA2RGB, 0);
    // cv.bilateralFilter(image, dst2, 9, 75, 75, cv.BORDER_DEFAULT);
    // cv.imshow('canvasOutput0', dst2);
    // dst1.delete();
    const dst3 = new cv.Mat();
    // 边缘检测
    cv.Canny(dst2, dst3, 50, 200);
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
  findMaxContour(image: any) {
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
  getBoxPoint(contour: any, ratio: number) {
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
    const points: any[] = [];
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

  warpImage(src: any, points: any[]) {
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
    const M: any = cv.getPerspectiveTransform(srcTri, dstTri, cv.DECOMP_LU);
    srcTri.delete();
    dstTri.delete();
    cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT);
    M.delete();
    return dst;
  }

  orderPoints(points: any[]): any[] {
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

  getDistance(point1: any, point2: any) {
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
  extractColor(src: any) {
    const dst = new cv.Mat(src.rows, src.cols, src.type());
    const threshold1 = 40;
    // const threshold2 = 20;
    for (let row = 0; row < src.rows; row++) {
      for (let col = 0; col < src.cols; col++) {
        const pixel = src.ucharPtr(row, col);
        const destPixel = dst.ucharPtr(row, col);
        const [r, g, b, a] = pixel;
        if (
          r - g > threshold1 &&
          r - b > threshold1 &&
          r - Math.max(g, b) > Math.abs(g - b) * 1.5
        ) {
          pixel.forEach((v, i) => {
            destPixel[i] = v;
          });
        } else {
          destPixel.fill(255);
        }
      }
    }
    cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(dst, dst, 177, 255, cv.THRESH_BINARY);
    return dst;
  }

  /**
   * 获取距离中心最近的矩形
   */
  getCenterRect(src: any) {
    const dst1 = new cv.Mat();
    // 取反色
    cv.bitwise_not(src, dst1);
    // 膨胀
    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    const anchor = new cv.Point(-1, -1);
    cv.dilate(
      dst1,
      dst1,
      kernel,
      anchor,
      6,
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
    for (let i = 0; i < contours.size(); ++i) {
      const cnt = contours.get(i);
      const rect = cv.boundingRect(cnt);
      const currentArea = cv.contourArea(cnt);
      if (
        currentArea > 1000 &&
        currentArea / (rect.width * rect.height) > 0.5
      ) {
        let distance: number;
        if (rect.x > centerX) {
          distance = rect.x - centerX;
        } else if (rect.x + rect.width < centerX) {
          distance = centerX - (rect.x + rect.width);
        }
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
  crop(src: any, rect: any) {
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

  resizeTo(
    src: any,
    { maxHeight, minHeight }: { maxHeight?: number; minHeight?: number }
  ) {
    let dsize: any;
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

  transform(imageData: ImageData, points: any[]) {
    const src = cv.matFromImageData(imageData);
    const dest = this.warpImage(src, points);
    const result = this.imageDataFromMat(dest);
    src.delete();
    dest.delete();
    return result;
  }

  async process(imageData: ImageData) {
    const result: any = {};
    const mat = cv.matFromImageData(imageData);
    if (mat.rows > mat.cols) {
      this.rotate(mat, 90);
      result.blob = this.imageDataFromMat(mat);
    }
    const ratio = 900 / mat.rows;
    const resize = this.resizeImg(mat, ratio);
    try {
      const canny = this.getCanny(resize);
      const maxContour = this.findMaxContour(canny);
      canny.delete();
      const points = this.getBoxPoint(maxContour, ratio);
      maxContour.delete();
      if (points.length === 4) {
        const dest = this.warpImage(mat, points);
        // const dest = await this.opencvService.transform(mat, points);
        result.rect = points;
        result.dest = this.imageDataFromMat(dest);
        dest.delete();
      }
    } catch (e) {
      console.error(e);
    }
    mat.delete();
    const dst1 = this.extractColor(resize);
    resize.delete();
    const rect = this.getCenterRect(dst1);
    try {
      if (rect) {
        const dst2 = this.crop(dst1, rect);
        this.resizeTo(dst2, { minHeight: 50 });
        const textImage = this.imageDataFromMat(dst2);
        let text = OCRAD(textImage, {
          numeric: true,
        });
        text = text.trim();
        console.log(text);
        result.name = text;
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

  debug(imageData: ImageData) {
    const result = [];
    const src = cv.matFromImageData(imageData);
    if (src.rows > src.cols) {
      this.rotate(src, 90);
    }
    const ratio = 900 / src.rows;
    const resize = this.resizeImg(src, ratio);
    const canny = this.getCanny(resize);
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
    const dst2 = this.extractColor(resize);
    result.push(dst2);
    const rect = this.getCenterRect(dst2);
    if (rect) {
      const rectangleColor = new cv.Scalar(255, 0, 0);
      const dst3 = cv.Mat.zeros(resize.rows, resize.cols, cv.CV_8UC3);
      const point1 = new cv.Point(rect.x, rect.y);
      const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
      cv.rectangle(dst3, point1, point2, rectangleColor, -1);
      result.push(dst3);
      const dst4 = this.crop(dst2, rect);
      console.log(dst4.rows);
      this.resizeTo(dst4, { minHeight: 50 });
      result.push(dst4);
    }
    const textImage = this.imageDataFromMat(dst2);
    let text = OCRAD(textImage, {
      numeric: true,
    });
    text = text.trim();
    console.log(text);
    resize.delete();
    src.delete();
    return result.map((mat) => {
      const img = this.imageDataFromMat(mat);
      mat.delete();
      return img;
    });
  }

  showMaxContour(src: any, maxContour: any) {
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

  showPoints(src: any, points: any[]) {
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
  async (e: MessageEvent) => {
    const { messageId, args, method: m } = e.data;
    const result: any = { messageId };
    try {
      await openCVService.init();
      let data = await openCVService[m](...args);
      result.success = true;
      result.data = data;
    } catch (e) {
      console.error(e);
      result.success = false;
      result.error = e;
    }
    self.postMessage(result);
  },
  false
);
