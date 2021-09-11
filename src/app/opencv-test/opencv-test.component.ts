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

  imageLoad(e) {
    const src = cv.imread(e.target);
    const dst = new cv.Mat();
    const ksize = new cv.Size(3, 3);
    // You can try more different parameters
    cv.GaussianBlur(src, dst, ksize, 2, 2, cv.BORDER_DEFAULT);
    // You can try more different parameters
    const dst2 = new cv.Mat();
    cv.Canny(dst, dst2, 60, 240, 3, false);
    const dst3 = new cv.Mat();
    const M = cv.Mat.ones(3, 3, cv.CV_8U);
    const anchor = new cv.Point(-1, -1);
    // You can try more different parameters
    cv.dilate(
      dst2,
      dst3,
      M,
      anchor,
      1,
      cv.BORDER_CONSTANT,
      cv.morphologyDefaultBorderValue()
    );
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    // You can try more different parameters
    cv.findContours(
      dst3,
      contours,
      hierarchy,
      cv.RETR_CCOMP,
      cv.CHAIN_APPROX_SIMPLE
    );
    let max_area = 0.0;
    let max_contour = [];
    for (let i = 0; i < contours.size(); ++i) {
      const contour=contours.get(i);
      let currentArea = cv.contourArea(contour);
      if (currentArea > max_area) {
        max_area = currentArea;
        max_contour = contour;
      }
    }
    

    cv.imshow('canvasOutput', dst3);
    src.delete();
    dst.delete();
    M.delete();
  }
}
