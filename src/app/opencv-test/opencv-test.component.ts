import { Component, ElementRef, NgZone, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Database } from '../core/service/database.service';
import { LazyService } from '../core/service/lazy.service';
import { OpenCVService } from '../core/service/opencv.service'
import cv, { Mat, Point, Rect } from 'opencv-ts';

// declare const cv: any;

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
    // console.log(data);
    // this.blob = data.blob;
    await this.opencvService.init();
    const src = await this.opencvService.fromBlob(data.blob);
    let ratio = 1;
    if (src.rows > 900) {
      ratio = 900 / src.rows;
    }
    const resize = this.opencvService.resizeImg(src, ratio);
    const dst2 = new cv.Mat();

    // cv.cvtColor(resize, resize, cv.COLOR_RGBA2RGB, 0);
    // cv.bilateralFilter(resize, dst2, 9, 75, 75, cv.BORDER_DEFAULT);
    // cv.medianBlur(resize, dst2, 5);
    // cv.imshow('canvasOutput0', dst2);
    const canny = this.opencvService.getCanny(resize);
    this.showCanny(canny);
    const maxContour = this.opencvService.findMaxContour(canny);
    canny.delete();
    this.showMaxContour(resize, maxContour);
    // let dst4 = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    const points = this.opencvService.getBoxPoint(maxContour, ratio);
    maxContour.delete();
    this.showPoints(resize, points);
    // points = this.orderPoints(points);
    // console.log(points);
    const dst = this.opencvService.warpImage(src, points);
    // const minColor = cv.matFromArray(1, 3, cv.CV_32S, [200, 200, 100]);
    // const maxColor = cv.matFromArray(1, 3, cv.CV_32S, [250, 250, 150]);
    let low = new cv.Mat(src.rows, src.cols, src.type(), [150, 0, 0, 0] as any);
    let high = new cv.Mat(src.rows, src.cols, src.type(), [
      255, 150, 150, 255,
    ] as any);
    console.log(cv);
    const dst3 = new cv.Mat();
    cv.inRange(src, low, high, dst3);
    cv.imshow('canvasOutput0', dst3);
    this.showWarp(dst);
    resize.delete();
    // points.delete();
    src.delete();
    dst.delete();
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

  // orderPoints(points: any[]) {
  //   points.sort((p1, p2) => p1.y - p2.y);
  //   const top = points.slice(0, 2);
  //   const bottom = points.splice(2, 4);
  //   top.sort((p1, p2) => p1.x - p2.x);
  //   bottom.sort((p1, p2) => p1.x - p2.x);
  //   return [...top, ...bottom];
  // }

  async imageLoad(e: Event) {
    const target = e.target as HTMLImageElement;
    // await this.opencvService.init();
    // const src = cv.imread(target);
    // let ratio = 1;
    // if (src.rows > 900) {
    //   ratio = 900 / src.rows;
    // }
    // const resize = this.opencvService.resizeImg(src, ratio);
    // const canny = this.opencvService.getCanny(resize);
    // this.showCanny(canny);
    // const maxContour = this.opencvService.findMaxContour(canny);
    // canny.delete();
    // this.showMaxContour(resize, maxContour);
    // // let dst4 = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    // const points = this.opencvService.getBoxPoint(maxContour);
    // maxContour.delete();
    // this.showPoints(resize, points);
    // // points = this.orderPoints(points);
    // // console.log(points);
    // const dst = this.opencvService.warpImage(resize, points);
    // this.showWarp(dst);
    // resize.delete();
    // points.delete();
    // src.delete();
    // dst.delete();
  }

  showCanny(canny: Mat) {
    cv.imshow('canvasOutput1', canny);
  }

  showMaxContour(src: Mat, maxContour: Mat) {
    const contours = new cv.MatVector();
    contours.push_back(maxContour);
    const color = new cv.Scalar(255, 0, 0);
    const dst = src.clone();
    const hierarchy = new cv.Mat();
    cv.drawContours(dst, contours, 0, color, 1, cv.LINE_8, hierarchy, 100);
    cv.imshow('canvasOutput2', dst);
    hierarchy.delete();
    dst.delete();
    contours.delete();
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
    cv.imshow('canvasOutput3', dst);
    dst.delete();
  }

  showWarp(dst: Mat) {
    cv.imshow('canvasOutput4', dst);
  }
}
