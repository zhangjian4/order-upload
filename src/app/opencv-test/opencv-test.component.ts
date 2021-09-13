import { Component, ElementRef, NgZone, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Database } from '../core/service/database.service';
import { LazyService } from '../core/service/lazy.service';
import { OpenCVService } from '../core/service/opencv.service';
import { base64ToBlob, urlToBase64 } from '../shared/util/image.util';

declare const cv: any;

@Component({
  selector: 'app-opencv-test',
  templateUrl: './opencv-test.component.html',
  styleUrls: ['./opencv-test.component.scss'],
})
export class OpencvTestComponent implements OnInit {
  imageSrc: SafeResourceUrl;
  ready: boolean;
  status = 'OpenCV.js is loading...';
  id: number;
  blob: Blob;

  constructor(
    private lazy: LazyService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private route: ActivatedRoute,
    private database: Database,
    private opencvService: OpenCVService
  ) {}

  async ngOnInit() {
    this.opencvService.init();
    this.route.queryParams.subscribe((params) => {
      this.id = +params.id;
      this.reload();
    });
    // await this.lazy.loadScript('/assets/js/opencv.js');
    // cv.then(() => {
    //   this.zone.run(() => {
    //     this.status = 'OpenCV.js is ready.';
    //     console.log(cv);
    //     this.ready = true;
    //   });
    // });
  }

  async reload() {
    const data = await this.database.preuploadFile.get(this.id);
    console.log(data);
    this.blob = data.blob;
    // await this.opencvService.init();
    // const src = cv.imread(data.blob);
    // console.log(src)
  }

  // async inputChange(e) {
  //   // const imageSrc = URL.createObjectURL(e.target.files[0]);
  //   // this.imageSrc = this.sanitizer.bypassSecurityTrustResourceUrl(imageSrc);
  //   const base64 = await urlToBase64('/assets/img/document.png');
  //   const blob = base64ToBlob(base64);
  //   const imageSrc = URL.createObjectURL(blob);
  //   this.imageSrc = this.sanitizer.bypassSecurityTrustResourceUrl(imageSrc);
  // }

  getCanny(image: any) {
    const binary = new cv.Mat();
    let dst = new cv.Mat();
    cv.cvtColor(image, dst, cv.COLOR_RGBA2GRAY, 0);
    cv.GaussianBlur(dst, binary, new cv.Size(3, 3), 2, 2, cv.BORDER_DEFAULT);
    cv.imshow('canvasOutput0', dst);
    const binary2 = new cv.Mat();
    cv.Canny(binary, binary2, 60, 240, 3, false);
    binary.delete();
    const binary3 = new cv.Mat();
    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    const anchor = new cv.Point(-1, -1);
    cv.dilate(
      binary2,
      binary3,
      kernel,
      anchor,
      1,
      cv.BORDER_CONSTANT,
      cv.morphologyDefaultBorderValue()
    );
    binary2.delete();
    return binary3;
  }

  findMaxContour(image) {
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    // You can try more different parameters
    cv.findContours(
      image,
      contours,
      hierarchy,
      cv.RETR_CCOMP,
      cv.CHAIN_APPROX_SIMPLE
    );
    let max_area = 0.0;
    let max_contour_index = 0;
    for (let i = 0; i < contours.size(); ++i) {
      const contour = contours.get(i);
      let currentArea = cv.contourArea(contour);
      if (currentArea > max_area) {
        max_area = currentArea;
        max_contour_index = i;
      }
    }
    const max_contour = contours.get(max_contour_index);
    return { contours, max_contour, max_contour_index, max_area, hierarchy };
  }

  getBoxPoint(contour) {
    // let approx = new cv.MatVector();
    let hull = new cv.Mat();
    // const cnt = contours.get(max_contour_index);
    cv.convexHull(contour, hull, false, true);
    let epsilon = 0.03 * cv.arcLength(contour, true);
    console.log(epsilon)
    let approx = new cv.Mat();
    cv.approxPolyDP(hull, approx, epsilon, true);
    // approx.push_back(hull);
    return approx;
    // console.log(hull);
    // let epsilon = 0.02 * cv.arcLength(contour, true);
    // let approx = new cv.Mat();
    // cv.approxPolyDP(contour, approx, epsilon, true);
    // return approx;
  }

  orderPoints(points: any[]) {
    points.sort((p1, p2) => p1.y - p2.y);
    const top = points.slice(0, 2);
    const bottom = points.splice(2, 4);
    top.sort((p1, p2) => p1.x - p2.x);
    bottom.sort((p1, p2) => p1.x - p2.x);
    return [...top, ...bottom];
  }

  getDistance(point1, point2) {
    return Math.sqrt(
      Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
    );
  }

  warpImage(image, box) {}

  async imageLoad(e) {
    const target = e.target;
    await this.opencvService.init();
    const src = cv.imread(target);
    const binary_img = this.getCanny(src);
    cv.imshow('canvasOutput1', binary_img);
    // let contours = new cv.MatVector();
    // let hierarchy = new cv.Mat();
    // You can try more different parameters
    // cv.findContours(
    //   dst3,
    //   contours,
    //   hierarchy,
    //   cv.RETR_CCOMP,
    //   cv.CHAIN_APPROX_SIMPLE
    // );
    // let max_area = 0.0;
    // let max_contour_index = 0;
    // for (let i = 0; i < contours.size(); ++i) {
    //   const contour = contours.get(i);
    //   let currentArea = cv.contourArea(contour);
    //   if (currentArea > max_area) {
    //     max_area = currentArea;
    //     max_contour_index = i;
    //   }
    // }
    const { contours, max_contour, max_contour_index } =
      this.findMaxContour(binary_img);
    let color = new cv.Scalar(255, 0, 0);
    const dst1 = src.clone();
    let hierarchy = new cv.Mat();
    cv.drawContours(
      dst1,
      contours,
      max_contour_index,
      color,
      1,
      cv.LINE_8,
      hierarchy,
      100
    );
    cv.imshow('canvasOutput2', dst1);
    // let dst4 = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    const box = this.getBoxPoint(max_contour);
    console.log(box);
    let circleColor = new cv.Scalar(255, 0, 0);
    let points = [];
    const dst2 = src.clone();
    for (let i = 0; i < box.rows; ++i) {
      let point = new cv.Point(box.data32S[i * 2], box.data32S[i * 2 + 1]);
      points.push(point);
      cv.circle(dst2, point, 5, circleColor, 2);
    }
    cv.imshow('canvasOutput3', dst2);
    points = this.orderPoints(points);
    console.log(points);
    let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      points[0].x,
      points[0].y,
      points[1].x,
      points[1].y,
      points[2].x,
      points[2].y,
      points[3].x,
      points[3].y,
    ]);
    const width = Math.round(
      Math.max(
        this.getDistance(points[0], points[1]),
        this.getDistance(points[2], points[3])
      )
    );
    const height = Math.round(
      Math.max(
        this.getDistance(points[0], points[2]),
        this.getDistance(points[1], points[3])
      )
    );
    console.log(srcTri);
    let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0,
      0,
      width,
      0,
      0,
      height,
      width,
      height,
    ]);
    let dst = new cv.Mat();
    let dsize = new cv.Size(width, height);
    let M = cv.getPerspectiveTransform(srcTri, dstTri);
    // You can try more different parameters
    cv.warpPerspective(
      src,
      dst,
      M,
      dsize,
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar()
    );
    cv.imshow('canvasOutput4', dst);
    // src.delete();
    // dst.delete();
    // M.delete();
  }
}
