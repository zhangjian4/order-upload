import {
  Component,
  ElementRef,
  NgZone,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { Database } from '../core/service/database.service';
import { LazyService } from '../core/service/lazy.service';
import { OpenCVService } from '../core/service/opencv.service';
import { OcradService } from '../core/service/ocrad.service';
// import * as OCRAD from 'ocrad.js';

// declare const cv: any;
declare const OCRAD: any;
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
  @ViewChild('container')
  container: ElementRef;
  constructor(
    private lazy: LazyService,
    private sanitizer: DomSanitizer,
    private zone: NgZone,
    private route: ActivatedRoute,
    private database: Database,
    private opencvService: OpenCVService,
    private ocradService: OcradService
  ) {}

  async ngOnInit() {
    this.opencvService.init();
    this.route.queryParams.subscribe((params) => {
      this.id = +params.id;
      this.reload();
    });
    await this.lazy.loadScript('/assets/js/ocrad.js');
    console.log(OCRAD);
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
    const result = await this.opencvService.debug(data.blob);
    const container = this.container.nativeElement as HTMLDivElement;
    for (const img of result) {
      const canvas = await this.opencvService.toCanvas(img);
      container.appendChild(canvas);
    }
    // console.log(src);
    // if(src.rows>src.cols){
    //   this.opencvService.rotate(src,90);
    // }
    // const ratio = 900 / src.rows;
    // const resize = this.opencvService.resizeImg(src, ratio);

    // // cv.cvtColor(resize, resize, cv.COLOR_RGBA2RGB, 0);
    // // cv.bilateralFilter(resize, dst2, 9, 75, 75, cv.BORDER_DEFAULT);
    // // cv.medianBlur(resize, dst2, 5);
    // // cv.imshow('canvasOutput0', dst2);
    // const canny = this.opencvService.getCanny(resize);
    // this.showCanny(canny);
    // const maxContour = this.opencvService.findMaxContour(canny);
    // canny.delete();
    // this.showMaxContour(resize, maxContour);
    // // let dst4 = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    // let points = this.opencvService.getBoxPoint(maxContour, ratio);
    // maxContour.delete();
    // if (points.length !== 4) {
    //   points = [
    //     new cv.Point(0, 0),
    //     new cv.Point(src.cols, 0),
    //     new cv.Point(src.cols, src.rows),
    //     new cv.Point(0, src.rows),
    //   ];
    // }
    // this.showPoints(src, points);
    // // points = this.orderPoints(points);
    // // console.log(points);
    // const dst = this.opencvService.warpImage(src, points);
    // // const minColor = cv.matFromArray(1, 3, cv.CV_32S, [200, 200, 100]);
    // // const maxColor = cv.matFromArray(1, 3, cv.CV_32S, [250, 250, 150]);
    // // let low = new cv.Mat(src.rows, src.cols, src.type(), [150, 0, 0, 0] as any);
    // // let high = new cv.Mat(src.rows, src.cols, src.type(), [
    // //   255, 150, 150, 255,
    // // ] as any);
    // // console.log(cv);
    // // const dst3 = new cv.Mat();
    // // cv.inRange(src, low, high, dst3);
    // // cv.imshow('canvasOutput0', dst3);
    // this.showWarp(dst);
    // // this.opencvService.resizeTo(dst, { maxHeight: 900 });
    // const dst2 = this.opencvService.extractColor(resize);
    // cv.imshow('canvasOutput5', dst2);
    // const rect = this.opencvService.getCenterRect(dst2);
    // if (rect) {
    //   const rectangleColor = new cv.Scalar(255, 0, 0);
    //   const dst3 = cv.Mat.zeros(resize.rows, resize.cols, cv.CV_8UC3);
    //   const point1 = new cv.Point(rect.x, rect.y);
    //   const point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
    //   cv.rectangle(dst3, point1, point2, rectangleColor, -1);
    //   cv.imshow('canvasOutput7', dst3);
    //   const dst4 = this.opencvService.crop(dst2, rect);
    //   console.log(dst4.rows);
    //   this.opencvService.resizeTo(dst4, { minHeight: 50 });
    //   cv.imshow('canvasOutput8', dst4);
    //   const canvas8 = document.getElementById(
    //     'canvasOutput8'
    //   ) as HTMLCanvasElement;
    //   const text = await this.ocradService.execute(canvas8, {
    //     numeric: true,
    //   });
    //   console.log(text);
    // }
    // // You can try more different parameters

    // resize.delete();
    // // points.delete();
    // src.delete();
    // dst.delete();
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

  // async imageLoad(e: Event) {
  //   const target = e.target as HTMLImageElement;
  //   await this.opencvService.init();
  //   const src = cv.imread(target);
  //   const dest = new cv.Mat(src.rows, src.cols, src.type());
  //   const threshold1 = 50;
  //   const threshold2 = 20;
  //   for (let row = 0; row < src.rows; row++) {
  //     for (let col = 0; col < src.cols; col++) {
  //       const pixel = src.ucharPtr(row, col);
  //       const destPixel = dest.ucharPtr(row, col);
  //       const [r, g, b, a] = pixel;
  //       if (
  //         r - g > threshold1 &&
  //         r - g > threshold1 &&
  //         Math.abs(g - b) < threshold2
  //       ) {
  //         pixel.forEach((v, i) => {
  //           destPixel[i] = v;
  //         });
  //         // destPixel[3] = 255;
  //         // console.log([r, g, b, a]);
  //       } else {
  //         destPixel.fill(255);
  //       }
  //     }
  //   }
  //   const dst = new cv.Mat();
  //   // You can try more different parameters
  //   cv.cvtColor(dest, dst, cv.COLOR_RGBA2GRAY, 0);
  //   cv.imshow('canvasOutput0', dst);

  //   // let ratio = 1;
  //   // if (src.rows > 900) {
  //   //   ratio = 900 / src.rows;
  //   // }
  //   // const resize = this.opencvService.resizeImg(src, ratio);
  //   // const canny = this.opencvService.getCanny(resize);
  //   // this.showCanny(canny);
  //   // const maxContour = this.opencvService.findMaxContour(canny);
  //   // canny.delete();
  //   // this.showMaxContour(resize, maxContour);
  //   // // let dst4 = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
  //   // const points = this.opencvService.getBoxPoint(maxContour);
  //   // maxContour.delete();
  //   // this.showPoints(resize, points);
  //   // // points = this.orderPoints(points);
  //   // // console.log(points);
  //   // const dst = this.opencvService.warpImage(resize, points);
  //   // this.showWarp(dst);
  //   // resize.delete();
  //   // points.delete();
  //   // src.delete();
  //   // dst.delete();
  // }

  image2Load(e: Event) {
    const target = e.target as HTMLImageElement;
    this.ocradService
      .execute(target, {
        numeric: true,
      })
      .then((text) => {
        console.log(text);
      });
  }

  // showCanny(canny: Mat) {
  //   cv.imshow('canvasOutput1', canny);
  // }

  // showMaxContour(src: Mat, maxContour: Mat) {
  //   const contours = new cv.MatVector();
  //   contours.push_back(maxContour);
  //   const color = new cv.Scalar(255, 0, 0);
  //   const dst = src.clone();
  //   const hierarchy = new cv.Mat();
  //   cv.drawContours(dst, contours, 0, color, 1, cv.LINE_8, hierarchy, 100);
  //   cv.imshow('canvasOutput2', dst);
  //   hierarchy.delete();
  //   dst.delete();
  //   contours.delete();
  // }

  // showPoints(src: Mat, points: Point[]) {
  //   const dst = src.clone();
  //   const color = new cv.Scalar(255, 0, 0);
  //   points.forEach((point) => {
  //     cv.circle(dst, point, 5, color, 2);
  //   });
  //   // for (let i = 0; i < approx.rows; ++i) {
  //   //   const point = new cv.Point(
  //   //     approx.data32S[i * 2],
  //   //     approx.data32S[i * 2 + 1]
  //   //   );
  //   //   cv.circle(dst, point, 5, color, 2);
  //   // }
  //   cv.imshow('canvasOutput3', dst);
  //   dst.delete();
  // }

  // showWarp(dst: Mat) {
  //   cv.imshow('canvasOutput4', dst);
  // }
}
