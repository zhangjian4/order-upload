import { Component, ElementRef, NgZone, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LazyService } from '../core/service/lazy.service';
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

  constructor(
    private lazy: LazyService,
    private sanitizer: DomSanitizer,
    private zone: NgZone
  ) {}

  async ngOnInit() {
    await this.lazy.loadScript('/assets/js/opencv.js');
    cv.then(() => {
      this.zone.run(() => {
        this.status = 'OpenCV.js is ready.';
        console.log(cv);
        this.ready = true;
      });
    });
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
    cv.GaussianBlur(image, binary, new cv.Size(3, 3), 2, 2, cv.BORDER_DEFAULT);
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
    let epsilon = 0.02 * cv.arcLength(contour, true);
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

  orderPoints(pts){


    for (let i = 0; i < pts.rows; ++i) {
      const x=pts.data32S[i * 2];
      const y=pts.data32S[i * 2 + 1]

      let far = new cv.Point(box.data32S[i * 2], box.data32S[i * 2 + 1]);
      console.log(far);
      cv.circle(src, far, 5, circleColor, 2);
    }
  }

  warpImage(image, box) {}

  imageLoad(e) {
    const src = cv.imread(e.target);
    const binary_img = this.getCanny(src);
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
    let dst4 = cv.Mat.zeros(src.cols, src.rows, cv.CV_8UC3);
    const box = this.getBoxPoint(max_contour);
    console.log(box);
    let circleColor = new cv.Scalar(255, 0, 0);
    for (let i = 0; i < box.rows; ++i) {
      let far = new cv.Point(box.data32S[i * 2], box.data32S[i * 2 + 1]);
      console.log(far);
      cv.circle(src, far, 5, circleColor, 2);
    }
    let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [31, 122, 331, 110, 18, 547, 368, 538]);
    console.log(srcTri);
    let dstTri = cv.matFromArray(
      4,
      1,
      cv.CV_32FC2,
      [0, 0, 300, 0, 0, 437, 300, 437]
    );
    let dst = new cv.Mat();
    let dsize = new cv.Size(300, 437);
    console.log(src)
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
    cv.imshow('canvasOutput', dst);
    // src.delete();
    // dst.delete();
    // M.delete();
  }
}
