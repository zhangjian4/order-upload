import {
  Component,
  ElementRef,
  HostBinding,
  HostListener,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {
  CameraPreview,
  CameraPreviewPictureOptions,
  CameraPreviewOptions,
  CameraPreviewDimensions,
} from '@ionic-native/camera-preview/ngx';
import {
  AlertController,
  NavController,
  Platform,
  ToastController,
} from '@ionic/angular';
import { WebView } from '@ionic-native/ionic-webview/ngx';
import { format } from 'date-fns';
import { BaiduAPIService } from '../core/service/baidu-api.service';
import {
  IndexedDBService,
  PREUPLOAD_PHOTO,
} from '../core/service/indexeddb.service';
import { Database, IUploadFile } from '../core/service/database.service';
import { CanConfirm } from '../shared/router-guard/can-confirm.interface';
import { ActivatedRoute, RouterStateSnapshot } from '@angular/router';
import * as SparkMD5 from 'spark-md5';
import {
  canvasToBase64,
  canvasToBlob,
  imageToBlob,
  imageToCanvas,
  imageToImageData,
  loadImage,
  urlToBlob,
} from '../shared/util/image.util';
import { OpenCVService } from '../core/service/opencv.service';
import { PreuploadService } from '../core/service/preupload.service';
import { CommonService } from '../core/service/common.service';
import { ProgressService } from '../shared/component/progress/progress.service';
import { Subject, takeUntil } from 'rxjs';
import {
  base64ToArrayBuffer,
  blobToArrayBuffer,
} from '../shared/util/buffer.util';
import { sleep, withTimeout } from '../shared/util/system.util';
import {
  DomSanitizer,
  SafeResourceUrl,
  SafeUrl,
} from '@angular/platform-browser';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss'],
})
export class CameraComponent implements CanConfirm, OnInit, OnDestroy {
  @ViewChild('fileInput')
  fileInput: ElementRef;
  @ViewChild('previewContainer')
  previewContainer: ElementRef<HTMLDivElement>;
  @ViewChild('thumbContainer')
  thumbContainer: ElementRef<HTMLDivElement>;
  // preview: boolean;
  file: string;
  imageSrc: string;
  base64: string;
  fileName: string;
  uploading: number;
  footerStyle: any = {};
  photoCount = 0;
  last: any;
  // db: any;
  // objectStore: any;
  // lastFile: number;
  viewEntered: boolean;
  cameraStarted: boolean;
  promises: Promise<any>[] = [];
  id: number;
  destroy$ = new Subject<void>();
  startTouchDistance: number;
  zoom = 1;
  previewStyle: any;
  hasCamera: boolean;
  points: any[];
  polygon: string;
  snapshotIndex = 0;
  snapshots: (SafeUrl | string)[] = [];
  snapshotStyles: any[] = [];
  takeSnapshotPromise: Promise<any>;
  private previewProcess: { stop?: boolean };
  constructor(
    private cameraPreview: CameraPreview,
    private zone: NgZone,
    private navController: NavController,
    private platform: Platform,
    public toastController: ToastController,
    public alertController: AlertController,
    private database: Database,
    private opencvService: OpenCVService,
    private route: ActivatedRoute,
    private preuploadService: PreuploadService,
    private commonService: CommonService,
    private progressService: ProgressService,
    private domSanitizer: DomSanitizer
  ) {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params.id) {
        this.id = +params.id;
      }
    });
    this.hasCamera = this.platform.is('cordova');
  }

  // @HostBinding('class.hide-background')
  get hideBackground(): boolean {
    return this.viewEntered && (!this.hasCamera || this.cameraStarted);
  }

  async ngOnInit() {
    this.previewStyle = {
      width: window.screen.width + 'px',
      height: (window.screen.width * 4) / 3 + 'px',
    };
    this.opencvService.init();
  }

  async ionViewWillEnter() {
    this.startCamera();
    // this.photoCount = this.preuploadService.data.length;
    // if (this.photoCount > 0) {
    //   const last = this.preuploadService.data[this.photoCount - 1];
    //   this.lastFile = last.origin;
    // } else {
    //   this.lastFile = null;
    // }
  }

  ionViewDidEnter() {
    this.viewEntered = true;
  }

  ionViewWillLeave() {
    this.viewEntered = false;
    this.stopCamera();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // this.stopCamera();
  }

  async startCamera() {
    // this.image = await this.urlToBase64('/assets/img/lake.jpg');
    const container = this.previewContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    if (this.hasCamera) {
      const cameraPreviewOpts: CameraPreviewOptions = {
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        camera: 'rear',
        tapPhoto: true,
        previewDrag: true,
        toBack: true,
        alpha: 1,
      };
      // start camera
      await this.cameraPreview.startCamera(cameraPreviewOpts);
      this.cameraStarted = true;
      this.startPreview();
      // this.cameraPreview.setZoom(0.5);
    }
  }

  async stopCamera() {
    if (this.hasCamera) {
      await this.cameraPreview.stopCamera();
    }
    this.zone.run(() => {
      this.cameraStarted = false;
    });
  }

  async startPreview() {
    this.stopPreview();
    const process: { stop?: boolean } = {};
    this.previewProcess = process;
    while (this.cameraStarted && !process.stop) {
      try {
        const base64 = await this.takeSnapshot(50);
        if (!this.cameraStarted || process.stop) {
          break;
        }
        await this.preview(base64);
      } catch (e) {
        console.error(e);
        await sleep(100);
      }
    }
  }

  stopPreview() {
    if (this.previewProcess) {
      this.previewProcess.stop = true;
      this.previewProcess = null;
    }
  }

  /**
   * 等待上一次快照结束再执行
   */
  async takeSnapshot(quality: number): Promise<string> {
    if (this.takeSnapshotPromise) {
      try {
        await this.takeSnapshotPromise;
      } catch (e) {
        console.error(e);
      }
    }
    try {
      //takeSnapshot有时候会不返回导致一直等待，这里加上超时时间
      this.takeSnapshotPromise = withTimeout(
        this.cameraPreview.takeSnapshot({ quality }),
        1000
      );
      const result = await this.takeSnapshotPromise;
      return result[0];
    } finally {
      this.takeSnapshotPromise = null;
    }
  }

  async takePicture() {
    const points = this.points;
    const base64 = await this.takeSnapshot(100);
    // const buffer = Buffer.from(base64, 'base64');
    const src = 'data:image/jpeg;base64,' + base64;
    this.stopPreview();
    this.showSnapshot(src, true).then(() => this.startPreview());
    const imageData = base64ToArrayBuffer(base64);
    await this.add(imageData, null, points);
  }

  async add(imageData: ArrayBuffer, name?: string, rect?: any[]) {
    if (this.id) {
      this.preuploadService.updateOrigin(this.id, imageData);
      this.back();
    } else {
      if (!name) {
        name = format(new Date(), 'yyyyMMddHHmmssSSS');
      }
      this.photoCount++;
      // const origin = await this.opencvService.fromBlob(blob);
      const imageId = await this.preuploadService.saveImageData(imageData);
      const item: IUploadFile = {
        name,
        origin: imageId,
        rect,
      };
      // this.lastFile = imageId;
      this.preuploadService.add(item);
      // item.id = await this.database.preuploadFile.add(item);
      this.process(item, imageData);
      return item;
    }
  }

  async process(item: IUploadFile, imageData: ArrayBuffer) {
    const promise = this.preuploadService.process(item, imageData);
    this.promises.push(promise);
    await promise;
    this.promises = this.promises.filter((p) => p !== promise);
  }

  async back() {
    this.navController.pop();
  }

  async submit() {
    if (this.promises.length) {
      await this.commonService.loading('正在处理图像', () =>
        Promise.all(this.promises)
      );
    }
    this.navController.navigateForward('/preupload');
  }

  clear() {
    this.photoCount = 0;
    // this.lastFile = null;
    this.preuploadService.clear();
  }

  async deactivateConfirm(nextState: RouterStateSnapshot) {
    if (nextState.url === '/preupload' || this.id != null) {
      return true;
    }
    const count = this.preuploadService.data.length;
    if (count === 0) {
      return true;
    }
    return new Promise<boolean>(async (resolve) => {
      const alert = await this.alertController.create({
        message: '放弃拍摄的' + count + '张图片?',
        buttons: [
          {
            text: '取消',
            role: 'cancel',
            handler: () => {
              resolve(false);
            },
          },
          {
            text: '放弃',
            handler: () => {
              this.clear();
              resolve(true);
            },
          },
        ],
      });
      await alert.present();
    });
  }

  selectFile() {
    this.fileInput.nativeElement.click();
  }

  async fileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    const progress = await this.progressService.create('正在加载图片');
    const promises = [];
    let finished = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      promises.push(
        this.addFile(file)
          .then((item) => {
            finished++;
            progress.next(finished / files.length);
            return item;
          })
          .catch((error) => {
            console.error(error);
          })
      );
    }
    const result = await Promise.all(promises);
    // result.forEach((item) => {
    //   if (item) {
    //     this.photoCount++;
    //     this.lastFile = item.origin;
    //     this.preuploadService.add(item);
    //   }
    // });
    progress.complete();
    // progress.close();
    input.value = null;
  }

  async addFile(file: File) {
    // const buffer = await file.arrayBuffer();
    // const rawImageData = jpeg.decode(buffer, { useTArray: true });
    const url = URL.createObjectURL(file);
    // console.log(rawImageData);
    try {
      const image = await loadImage(url);
      let scale: number;
      if (image.height >= image.width && image.width > 1080) {
        scale = 1080 / image.width;
      } else if (image.height < image.width && image.height > 1080) {
        scale = 1080 / image.height;
      }
      const canvas = imageToCanvas(image, scale);
      const imageData = await canvasToBlob(canvas);

      const buffer = await blobToArrayBuffer(imageData);
      const src = this.domSanitizer.bypassSecurityTrustUrl(url);
      if (!this.hasCamera) {
        this.previewStyle.background = `url(${url}) no-repeat top/100%`;
        const base64 = canvasToBase64(canvas);
        this.showSnapshot(src, true);
        this.preview(base64);
      } else {
        this.showSnapshot(src, false);
      }

      let name = file.name;
      const index = name.lastIndexOf('.');
      if (index !== -1) {
        name = name.substring(0, index);
      }
      const item = await this.add(buffer, name);
      // const imageId = await this.preuploadService.saveImageData(buffer);
      // const item: IUploadFile = {
      //   name: file.name,
      //   origin: imageId,
      // };
      // this.process(item, buffer);
      return item;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async preview(imageData: string | ArrayBuffer) {
    this.points = await this.opencvService.preview(imageData);
    if (this.points) {
      const width = this.previewContainer.nativeElement.clientWidth;
      this.polygon = this.points
        .map((point) => point.x * width + ',' + point.y * width)
        .join(' ');
    } else {
      this.polygon = null;
    }
  }

  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 2) {
      this.startTouchDistance = this.getTouchDistance(event);
    }
  }

  getTouchDistance(event: TouchEvent) {
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    return Math.sqrt(
      Math.pow(touch1.pageX - touch2.pageX, 2) +
        Math.pow(touch1.pageY - touch2.pageY, 2)
    );
  }

  onTouchMove(event) {
    if (event.touches.length === 2) {
      const distance = this.getTouchDistance(event);
      let change = (distance - this.startTouchDistance) / 10;
      change = change > 0 ? Math.floor(change) : Math.ceil(change);
      if (change !== 0) {
        this.zoom += change;
        if (this.zoom < 1) {
          this.zoom = 1;
        } else if (this.zoom > 10) {
          this.zoom = 10;
        }
        this.cameraPreview.setZoom(this.zoom);
        this.startTouchDistance = distance;
      }
    }
  }

  async showSnapshot(src: string | SafeUrl, animation: boolean) {
    const lastIndex = this.snapshotIndex;
    if (animation) {
      this.snapshotIndex = 1 - this.snapshotIndex;
    }
    const currentIndex = this.snapshotIndex;
    const container = this.previewContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    this.snapshots[currentIndex] = src;
    if (animation) {
      this.snapshotStyles[currentIndex] = {};
      await sleep(1000);
      this.polygon = null;
    }
    const thumbContainer = this.thumbContainer.nativeElement;
    const thumbRect = thumbContainer.getBoundingClientRect();
    const scale = thumbRect.width / rect.width;
    const translateX = thumbRect.left;
    const translateY = thumbRect.top - rect.top;
    this.snapshotStyles[currentIndex] = {
      transform: `translate(${translateX}px,${translateY}px) scale(${scale})`,
      zIndex: 1,
    };
    if (animation) {
      await sleep(500);
      this.snapshotStyles[currentIndex].zIndex = 0;
      this.snapshots[lastIndex] = null;
    }
  }
}
