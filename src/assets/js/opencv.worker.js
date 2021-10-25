var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var OpenCVService = /** @class */ (function () {
    function OpenCVService() {
    }
    OpenCVService.prototype.init = function () {
        if (!this.initPromise) {
            this.initPromise = new Promise(function (resolve) {
                self.importScripts('/assets/js/opencv.js', '/assets/js/ocrad.js');
                cv = cv();
                cv.onRuntimeInitialized = resolve;
            });
        }
        return this.initPromise;
    };
    OpenCVService.prototype.imageDataFromMat = function (mat) {
        // converts the mat type to cv.CV_8U
        var img = new cv.Mat();
        var depth = mat.type() % 8;
        var scale = depth <= cv.CV_8S ? 1.0 : depth <= cv.CV_32S ? 1.0 / 256.0 : 255.0;
        var shift = depth === cv.CV_8S || depth === cv.CV_16S ? 128.0 : 0.0;
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
                throw new Error('Bad number of channels (Source image must have 1, 3 or 4 channels)');
        }
        var clampedArray = new ImageData(new Uint8ClampedArray(img.data), img.cols, img.rows);
        // mat.delete();
        img.delete();
        return clampedArray;
    };
    OpenCVService.prototype.rotate = function (src, angle) {
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
    };
    OpenCVService.prototype.resizeImg = function (image, radio) {
        var dst = new cv.Mat();
        var dsize = new cv.Size(Math.round(image.cols * radio), Math.round(image.rows * radio));
        cv.resize(image, dst, dsize, 0, 0, cv.INTER_AREA);
        return dst;
    };
    /**
     * 滤波，去噪点
     *
     * @param image
     * @returns
     */
    OpenCVService.prototype.blur = function (image) {
        var dst = new cv.Mat();
        // 高斯模糊
        cv.GaussianBlur(image, dst, new cv.Size(3, 3), 2, 2, cv.BORDER_DEFAULT);
        // 中值滤波
        // cv.medianBlur(image, dst, 1);
        // 双边滤波
        // cv.cvtColor(image, image, cv.COLOR_RGBA2RGB, 0);
        // cv.bilateralFilter(image, dst, 9, 75, 75, cv.BORDER_DEFAULT);
        return dst;
    };
    OpenCVService.prototype.sharpen = function (src) {
        var dst = new cv.Mat();
        var array = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        var M = cv.matFromArray(3, 3, cv.CV_32FC1, array);
        // You can try more different parameters
        cv.filter2D(src, dst, src.depth(), M);
        M.delete();
        return dst;
    };
    OpenCVService.prototype.getCanny = function (image) {
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
        var dst = new cv.Mat();
        // 边缘检测
        cv.Canny(image, dst, 50, 200);
        // dst2.delete();
        // const dst4 = new cv.Mat();
        var kernel = cv.Mat.ones(3, 3, cv.CV_8U);
        var anchor = new cv.Point(-1, -1);
        // 膨胀操作，尽量使边缘闭合
        cv.dilate(dst, dst, kernel, anchor, 3, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
        kernel.delete();
        // dst3.delete();
        return dst;
    };
    /**
     * 求出面积最大的轮廓
     *
     * @param image
     * @returns
     */
    OpenCVService.prototype.findMaxContour = function (image) {
        var contours = new cv.MatVector();
        var hierarchy = new cv.Mat();
        cv.findContours(image, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
        var maxArea = 0.0;
        var maxContour = null;
        for (var i = 0; i < contours.size(); i++) {
            var contour = contours.get(i);
            var rect = cv.boundingRect(contour);
            var currentArea = rect.width * rect.height;
            // const currentArea = cv.contourArea(contour);
            if (currentArea > maxArea) {
                maxArea = currentArea;
                maxContour = contour;
            }
        }
        contours.delete();
        hierarchy.delete();
        return maxContour;
    };
    /**
     * 多边形拟合凸包的四个顶点
     *
     * @param contour
     * @returns
     */
    OpenCVService.prototype.getBoxPoint = function (contour, ratio) {
        var hull = new cv.Mat();
        // 多边形拟合凸包
        cv.convexHull(contour, hull);
        // 输出的精度，就是另个轮廓点之间最大距离数，根据周长来计算
        var epsilon = 0.03 * cv.arcLength(contour, true);
        var approx = new cv.Mat();
        // 多边形拟合
        cv.approxPolyDP(hull, approx, epsilon, true);
        hull.delete();
        // return approx;
        var points = [];
        for (var i = 0; i < approx.rows; ++i) {
            var point = new cv.Point(approx.data32S[i * 2] / ratio, approx.data32S[i * 2 + 1] / ratio);
            points.push(point);
        }
        approx.delete();
        return points;
    };
    OpenCVService.prototype.warpImage = function (src, points) {
        points = this.orderPoints(points);
        var p0 = points[0], p1 = points[1], p2 = points[2], p3 = points[3];
        var width = Math.round(Math.max(this.getDistance(p0, p1), this.getDistance(p2, p3)));
        var height = Math.round(Math.max(this.getDistance(p1, p2), this.getDistance(p3, p0)));
        var srcArray = [];
        points.forEach(function (point) {
            srcArray.push(point.x, point.y);
        });
        var srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, srcArray);
        var dstArray = [0, 0, width, 0, width, height, 0, height];
        var dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, dstArray);
        var dst = new cv.Mat();
        var dsize = new cv.Size(width, height);
        var M = cv.getPerspectiveTransform(srcTri, dstTri, cv.DECOMP_LU);
        srcTri.delete();
        dstTri.delete();
        cv.warpPerspective(src, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT);
        M.delete();
        return dst;
    };
    OpenCVService.prototype.orderPoints = function (points) {
        // 找出离左上角最近的点作为第一个点
        var firstIndex;
        var min;
        points.forEach(function (point, i) {
            var sum = point.x + point.y;
            if (min == null || sum < min) {
                min = sum;
                firstIndex = i;
            }
        });
        if (firstIndex === 0) {
            return points;
        }
        else {
            return points
                .slice(firstIndex, points.length)
                .concat(points.slice(0, firstIndex));
        }
    };
    OpenCVService.prototype.getDistance = function (point1, point2) {
        return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
    };
    /**
     * 提取红色
     *
     * @param src
     * @returns
     */
    OpenCVService.prototype.extractColor = function (src) {
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
        var dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
        var threshold1 = 35;
        // const threshold2 = 20;
        var srcData = src.data;
        var index = 0;
        for (var row = 0; row < src.rows; row++) {
            for (var col = 0; col < src.cols; col++) {
                var r = srcData[index];
                var g = srcData[index + 1];
                var b = srcData[index + 2];
                // const pixel = src.ucharPtr(row, col);
                // const destPixel = dst.ucharPtr(row, col);
                // const [r, g, b, _a] = pixel;
                if (r - g > threshold1 &&
                    r - b > threshold1 &&
                    r - Math.max(g, b) > Math.abs(g - b) * 1.5) {
                    dst.ucharPtr(row, col)[0] = 255;
                }
                index += 4;
            }
        }
        // cv.cvtColor(dst, dst, cv.COLOR_RGBA2GRAY, 0);
        // cv.threshold(dst, dst, 177, 255, cv.THRESH_BINARY);
        return dst;
    };
    /**
     * 获取距离中心最近的矩形
     */
    OpenCVService.prototype.getCenterRect = function (src) {
        var dst1 = new cv.Mat();
        // cv.threshold(dst1, dst1, 177, 255, cv.THRESH_BINARY);
        // 取反色
        // cv.bitwise_not(src, dst1);
        // 膨胀
        var kernel = cv.Mat.ones(3, 3, cv.CV_8U);
        var anchor = new cv.Point(-1, -1);
        // cv.erode(src, dst1, kernel, anchor, 9, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
        cv.dilate(src, dst1, kernel, anchor, 9, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
        kernel.delete();
        // cv.imshow('canvasOutput6', dst1);
        var contours = new cv.MatVector();
        var hierarchy = new cv.Mat();
        cv.findContours(dst1, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
        hierarchy.delete();
        var minDistance;
        var nearestRect = null; // 离中心最近的矩形
        var centerX = src.cols / 2;
        var centerY = src.rows / 2;
        for (var i = 0; i < contours.size(); ++i) {
            var cnt = contours.get(i);
            var rect = cv.boundingRect(cnt);
            var currentArea = cv.contourArea(cnt);
            if (currentArea > 1000 &&
                currentArea / (rect.width * rect.height) > 0.5) {
                var dx = Math.abs(rect.x + rect.width / 2 - centerX) / src.cols;
                var dy = Math.abs(rect.y + rect.height / 2 - centerY) / src.rows;
                var distance = Math.max(dx, dy);
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
    };
    OpenCVService.prototype.crop = function (src, rect) {
        var dst = new cv.Mat(rect.height, rect.width, cv.CV_8UC1);
        for (var row = 0; row < dst.rows; row++) {
            for (var col = 0; col < dst.cols; col++) {
                var pixel = src.ucharPtr(rect.y + row, rect.x + col);
                var destPixel = dst.ucharPtr(row, col);
                destPixel[0] = pixel[0];
            }
        }
        return dst;
    };
    OpenCVService.prototype.resizeTo = function (src, _a) {
        var maxHeight = _a.maxHeight, minHeight = _a.minHeight;
        var dsize;
        if (maxHeight && src.rows > maxHeight) {
            var ratio = maxHeight / src.rows;
            dsize = new cv.Size(Math.round(src.cols * ratio), Math.round(src.rows * ratio));
        }
        if (minHeight && src.rows < minHeight) {
            // 放大整数倍
            var ratio = Math.ceil(minHeight / src.rows);
            dsize = new cv.Size(src.cols * ratio, src.rows * ratio);
        }
        if (dsize) {
            cv.resize(src, src, dsize, 0, 0, cv.INTER_LINEAR);
        }
    };
    // transform(src: any, points: any[]) {
    //   const dest = this.warpImage(src, points);
    //   const result = this.imageDataFromMat(dest);
    //   src.delete();
    //   dest.delete();
    //   return result;
    // }
    OpenCVService.prototype.ocr = function (src) {
        var imageData = this.imageDataFromMat(src);
        var text = OCRAD(imageData, {
            numeric: true,
        });
        text = text.trim();
        console.log(text);
        return text;
    };
    OpenCVService.prototype.process = function (mat) {
        return __awaiter(this, void 0, void 0, function () {
            var result, ratio, resize, sharpen, blur, canny, maxContour, points, dest, dst1, rect, dst2, text;
            return __generator(this, function (_a) {
                result = {};
                if (mat.rows > mat.cols) {
                    this.rotate(mat, 90);
                    result.blob = mat;
                }
                ratio = 1080 / mat.rows;
                resize = this.resizeImg(mat, ratio);
                try {
                    sharpen = this.sharpen(resize);
                    blur = this.blur(sharpen);
                    sharpen.delete();
                    canny = this.getCanny(blur);
                    blur.delete();
                    maxContour = this.findMaxContour(canny);
                    canny.delete();
                    points = this.getBoxPoint(maxContour, ratio);
                    maxContour.delete();
                    if (points.length === 4) {
                        dest = this.warpImage(mat, points);
                        // const dest = await this.opencvService.transform(mat, points);
                        result.rect = points;
                        result.dest = dest;
                        // dest.delete();
                    }
                }
                catch (e) {
                    console.error(e);
                }
                dst1 = this.extractColor(resize);
                resize.delete();
                try {
                    rect = this.getCenterRect(dst1);
                    if (rect) {
                        dst2 = this.crop(dst1, rect);
                        this.resizeTo(dst2, { minHeight: 50 });
                        cv.bitwise_not(dst2, dst2);
                        text = this.ocr(dst2);
                        if (text) {
                            result.name = text;
                        }
                        dst2.delete();
                    }
                }
                catch (e) {
                    console.error(e);
                }
                finally {
                    dst1.delete();
                }
                return [2 /*return*/, result];
            });
        });
    };
    OpenCVService.prototype.debug = function (src) {
        var result = [];
        var start = new Date().getTime();
        var debugTime = function (method) {
            var current = new Date().getTime();
            console.log(method + ' use time:' + (current - start) + 'ms');
            start = current;
        };
        try {
            if (src.rows > src.cols) {
                this.rotate(src, 90);
                debugTime('rotate');
            }
            var ratio = 1080 / src.rows;
            var resize = this.resizeImg(src, ratio);
            debugTime('resizeImg');
            var sharpen = this.sharpen(resize);
            debugTime('sharpen');
            result.push(sharpen);
            var blur = this.blur(sharpen);
            debugTime('blur');
            result.push(blur);
            var canny = this.getCanny(blur);
            debugTime('getCanny');
            result.push(canny);
            var maxContour = this.findMaxContour(canny);
            debugTime('findMaxContour');
            result.push(this.showMaxContour(resize, maxContour));
            debugTime('showMaxContour');
            var points = this.getBoxPoint(maxContour, ratio);
            debugTime('getBoxPoint');
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
            var dst = this.warpImage(src, points);
            debugTime('warpImage');
            result.push(dst);
            var dst2 = this.extractColor(resize);
            debugTime('extractColor');
            result.push(dst2);
            var rect = this.getCenterRect(dst2);
            debugTime('getCenterRect');
            if (rect) {
                var rectangleColor = new cv.Scalar(255, 0, 0);
                var dst3 = cv.Mat.zeros(resize.rows, resize.cols, cv.CV_8UC3);
                var point1 = new cv.Point(rect.x, rect.y);
                var point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
                cv.rectangle(dst3, point1, point2, rectangleColor, -1);
                debugTime('rectangle');
                result.push(dst3);
                var dst4 = this.crop(dst2, rect);
                debugTime('crop');
                this.resizeTo(dst4, { minHeight: 50 });
                debugTime('resizeTo');
                cv.bitwise_not(dst4, dst4);
                debugTime('bitwise_not');
                result.push(dst4);
                var text = this.ocr(dst4);
                debugTime('ocr');
                console.log(text);
            }
            resize.delete();
            src.delete();
        }
        catch (e) {
            console.error(e);
        }
        return result;
    };
    OpenCVService.prototype.showMaxContour = function (src, maxContour) {
        var contours = new cv.MatVector();
        contours.push_back(maxContour);
        var color = new cv.Scalar(255, 0, 0);
        var dst = src.clone();
        var hierarchy = new cv.Mat();
        cv.drawContours(dst, contours, 0, color, 1, cv.LINE_8, hierarchy, 100);
        hierarchy.delete();
        contours.delete();
        return dst;
    };
    OpenCVService.prototype.showPoints = function (src, points) {
        var dst = src.clone();
        var color = new cv.Scalar(255, 0, 0);
        points.forEach(function (point) {
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
    };
    return OpenCVService;
}());
var openCVService = new OpenCVService();
self.addEventListener('message', function (event) { return __awaiter(_this, void 0, void 0, function () {
    var _a, messageId, args, m, result, mats, transfer, start, params, data_1, imageData, e_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = event.data, messageId = _a.messageId, args = _a.args, m = _a.method;
                result = { messageId: messageId };
                mats = [];
                transfer = [];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, 5, 6]);
                return [4 /*yield*/, openCVService.init()];
            case 2:
                _b.sent();
                start = new Date().getTime();
                console.log('[worker]execute ' + m + ' start:' + start);
                params = args.map(function (arg) {
                    if (arg instanceof ImageData) {
                        var mat = cv.matFromImageData(arg);
                        mats.push(mat);
                        return mat;
                    }
                    else {
                        return arg;
                    }
                });
                return [4 /*yield*/, openCVService[m].apply(openCVService, params)];
            case 3:
                data_1 = _b.sent();
                console.log('[worker]execute ' + m + ' end:' + (new Date().getTime() - start));
                if (data_1) {
                    if (data_1 instanceof cv.Mat) {
                        imageData = openCVService.imageDataFromMat(data_1);
                        data_1.delete();
                        transfer.push(imageData.data.buffer);
                        data_1 = imageData;
                    }
                    else if (Array.isArray(data_1)) {
                        data_1.forEach(function (item, i) {
                            if (item instanceof cv.Mat) {
                                var imageData = openCVService.imageDataFromMat(item);
                                item.delete();
                                transfer.push(imageData.data.buffer);
                                data_1[i] = imageData;
                            }
                        });
                    }
                    else if (typeof data_1 === 'object') {
                        Object.keys(data_1).forEach(function (key) {
                            var item = data_1[key];
                            if (item instanceof cv.Mat) {
                                var imageData = openCVService.imageDataFromMat(item);
                                item.delete();
                                transfer.push(imageData.data.buffer);
                                data_1[key] = imageData;
                            }
                        });
                    }
                }
                result.success = true;
                result.data = data_1;
                return [3 /*break*/, 6];
            case 4:
                e_1 = _b.sent();
                console.error(e_1);
                result.success = false;
                result.error = e_1;
                return [3 /*break*/, 6];
            case 5:
                mats.forEach(function (mat) {
                    if (!mat.isDeleted()) {
                        mat.delete();
                    }
                });
                return [7 /*endfinally*/];
            case 6:
                self.postMessage(result);
                return [2 /*return*/];
        }
    });
}); }, false);
