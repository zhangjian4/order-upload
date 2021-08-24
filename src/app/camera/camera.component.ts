import {
  Component,
  HostBinding,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  CameraPreview,
  CameraPreviewPictureOptions,
  CameraPreviewOptions,
  CameraPreviewDimensions,
} from '@ionic-native/camera-preview/ngx';
import { NavController, Platform } from '@ionic/angular';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { format } from 'date-fns';
import { BaiduAPIService } from '../core/service/baidu-api.service';
import * as SparkMD5 from 'spark-md5';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss'],
})
export class CameraComponent implements OnInit, OnDestroy {
  @HostBinding('class.camera-opened')
  cameraOpened: boolean;
  preview: boolean;
  file: string;
  imageSrc: string;
  base64: string;
  fileName: string;
  uploading: boolean;

  constructor(
    private cameraPreview: CameraPreview,
    private zone: NgZone,
    private navController: NavController,
    private webview: WebView,
    private baiduAPIService: BaiduAPIService,
    private platform: Platform
  ) {}

  ngOnInit() {
    this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async startCamera() {
    // this.image = await this.urlToBase64('/assets/img/lake.jpg');
    const cameraPreviewOpts: CameraPreviewOptions = {
      x: 0,
      y: 0,
      width: window.screen.width,
      height: window.screen.height,
      camera: 'rear',
      tapPhoto: true,
      previewDrag: true,
      toBack: true,
      alpha: 1,
    };

    // start camera
    await this.cameraPreview.startCamera(cameraPreviewOpts);
    this.zone.run(() => {
      this.cameraOpened = true;
    });
  }

  async stopCamera() {
    await this.cameraPreview.stopCamera();
    this.zone.run(() => {
      this.cameraOpened = false;
    });
  }

  async takePicture() {
    if (this.platform.is('cordova')) {
      this.base64 = await this.cameraPreview.takePicture({ quality: 85 });
      if (this.base64) {
        this.zone.run(() => {
          this.fileName = format(new Date(), 'yyyyMMddHHmmss');
          this.imageSrc = 'data:image/jpeg;base64,' + this.base64;
          this.preview = true;
        });
      }
    } else {
      this.imageSrc = '/assets/img/lake.jpg';
      this.base64 = await this.urlToBase64(this.imageSrc);
      this.fileName = format(new Date(), 'yyyyMMddHHmmss');
      this.preview = true;
    }
  }

  back() {
    this.navController.back();
  }

  continue() {
    this.base64 = null;
    this.imageSrc = null;
    this.preview = false;
  }

  async uploadAndContinue() {
    await this.upload();
    this.continue();
  }

  async uploadAndExit() {
    await this.upload();
    this.back();
  }

  async upload() {
    const blob = this.base64ToBlob(this.base64);
    const fileName = this.fileName + '.jpg';
    await this.baiduAPIService.upload(fileName, blob);
  }

  urlToBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.src = url;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, image.width, image.height);
        const ext = image.src
          .substring(image.src.lastIndexOf('.') + 1)
          .toLowerCase();
        let base64 = canvas.toDataURL('image/jpeg');
        console.log(base64);
        base64 = base64.substr(base64.indexOf(',') + 1);
        resolve(base64);
      };
      image.onerror = (e) => {
        reject(e);
      };
    });
  }

  base64ToBlob(dataurl) {
    const mime = 'image/jpeg';
    const bstr = atob(dataurl);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {
      type: mime,
    });
  }
}
