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
  base64ToArrayBuffer,
  base64ToBlob,
  base64ToImageData,
  blobToArrayBuffer,
  imageToBlob,
  imageToImageData,
  loadImage,
  urlToBlob,
} from '../shared/util/image.util';
import { OpenCVService } from '../core/service/opencv.service';
import { PreuploadService } from '../core/service/preupload.service';
import { CommonService } from '../core/service/common.service';
import { ProgressService } from '../shared/component/progress/progress.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss'],
})
export class CameraComponent implements CanConfirm, OnInit, OnDestroy {
  @ViewChild('fileInput')
  fileInput: ElementRef;
  @ViewChild('canvas')
  canvas: HTMLCanvasElement;
  preview: boolean;
  file: string;
  imageSrc: string;
  base64: string;
  fileName: string;
  uploading: number;
  footerStyle: any = {};
  photoCount = 0;
  last: any;
  db: any;
  objectStore: any;
  lastFile: number;
  viewEntered: boolean;
  cameraStarted: boolean;
  promises: Promise<any>[] = [];
  id: number;
  destroy$ = new Subject<void>();
  startTouchDistance: number;
  zoom = 1;
  previewStyle: any;
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
    private progressService: ProgressService
  ) {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params.id) {
        this.id = +params.id;
      }
    });
  }

  @HostBinding('class.hide-background')
  get hideBackground(): boolean {
    return this.viewEntered && this.cameraStarted;
  }

  async ngOnInit() {
    this.previewStyle = {
      width: window.screen.width + 'px',
      height: (window.screen.width * 4) / 3 + 'px',
    };
    this.opencvService.init();
    // this.startCamera();
    // this.clear();
    // this.db = await this.indexedDBService.open();
    // console.log(this.db);
    // if (!this.db.objectStoreNames.contains('preupload-photo')) {
    //   this.objectStore = this.db.createObjectStore('preupload-photo', { autoIncrement: true });
    // }
    // window.removeEventListener('')
    // window.addEventListener('ionKeyboardDidShow', ev => {
    //   const { keyboardHeight } = ev;
    //   // Do something with the keyboard height such as translating an input above the keyboard.
    // });
    // window.addEventListener('ionKeyboardDidHide', () => {
    //   // Move input back to original location
    // });
  }

  async ionViewWillEnter() {
    this.startCamera();
    this.photoCount = this.preuploadService.data.length;
    if (this.photoCount > 0) {
      const last = this.preuploadService.data[this.photoCount - 1];
      this.lastFile = last.origin;
    } else {
      this.lastFile = null;
    }
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
    if (this.platform.is('cordova')) {
      const cameraPreviewOpts: CameraPreviewOptions = {
        x: 0,
        y: 100,
        width: window.screen.width,
        height: (window.screen.width * 4) / 3,
        camera: 'rear',
        tapPhoto: true,
        previewDrag: true,
        toBack: true,
        alpha: 1,
      };
      // start camera
      await this.cameraPreview.startCamera(cameraPreviewOpts);
      // this.cameraPreview.setZoom(0.5);
      this.zone.run(() => {
        this.cameraStarted = true;
      });
    }
  }

  async stopCamera() {
    if (this.platform.is('cordova')) {
      await this.cameraPreview.stopCamera();
      this.zone.run(() => {
        this.cameraStarted = false;
      });
    }
  }

  async takePicture() {
    const base64 = await this.cameraPreview.takeSnapshot({ quality: 100 });
    // const buffer = Buffer.from(base64, 'base64');
    const imageData = base64ToArrayBuffer(base64);
    await this.add(imageData);
    // if (this.platform.is('cordova')) {
    //   const input = document.createElement('input');
    //   input.type = 'file';
    //   const base64 = await this.cameraPreview.takeSnapshot({ quality: 100 });
    //   blob = base64ToBlob(base64);
    // } else {
    //   blob = await urlToBlob(`/assets/img/test${this.photoCount % 5}.jpg`);
    // }
    // if (this.id) {
    //   this.preuploadService.updateBlob(this.id, blob);
    //   // await this.database.preuploadFile.update(this.id, { blob });
    //   this.back();
    // } else {
    //   const name = format(new Date(), 'yyyyMMddHHmmssSSS');
    //   this.photoCount++;
    //   this.lastFile = blob;
    //   const item: IUploadFile = {
    //     name,
    //     blob,
    //   };
    //   item.id = await this.database.preuploadFile.add(item);
    //   this.promises.push(this.preuploadService.process(item));
    // }
    // const buffer = base64ToArrayBuffer(base64);
    // const blob = new Blob([buffer], {
    //   type: 'image/jpeg',
    // });
    // const blob = base64ToBlob(base64);
    // const spark = new SparkMD5.ArrayBuffer();
    // spark.append(blob);
    // const md5 = spark.end();

    // this.lastFileId = id;
    // this.zone.run(() => {
    //   const fileName = format(new Date(), 'yyyyMMddHHmmssSSS');
    //   this.last = { base64, fileName };
    //   this.photoCount++;
    //   // this.photoList.push(this.last);
    //   this.database.preuploadFile.add({ name: fileName });
    //   // this.indexedDBService.add('preupload-photo', this.last);
    //   // this.imageSrc = 'data:image/jpeg;base64,' + this.base64;
    //   // this.preview = true;
    //   // this.hideBackground = false;
    // });
  }

  async add(imageData: ArrayBuffer, name?: string) {
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
      };
      this.lastFile = imageId;
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

  // async handlePhoto(id: number, blob: Blob) {
  //   const src = await this.opencvService.fromBlob(blob);
  //   try {
  //     const changes: any = {};
  //     const rect = await this.opencvService.getPagerRect(src);
  //     if (rect.length === 4) {
  //       const dest = await this.opencvService.transform(src, rect);
  //       changes.rect = rect;
  //       changes.dest = dest;
  //     }
  //     const orderNo = await this.opencvService.getOrderNo(src);
  //     if (orderNo && orderNo.length >= 7) {
  //       changes.name = orderNo;
  //     }
  //     if (Object.keys(changes).length) {
  //       await this.database.preuploadFile.update(id, changes);
  //     }
  //     // await this.sleep();
  //   } catch (e) {
  //     console.error(e);
  //   } finally {
  //     src.delete();
  //   }
  // }

  async back() {
    this.navController.pop();
    // if (this.photoCount) {
    //   const alert = await this.alertController.create({
    //     cssClass: 'my-custom-class',
    //     message: '放弃拍摄的' + this.photoCount + '张图片?',
    //     buttons: [
    //       {
    //         text: '取消',
    //         role: 'cancel',
    //         cssClass: 'secondary',
    //       },
    //       {
    //         text: '放弃',
    //         handler: () => {
    //           this.clear();
    //           this.navController.back();
    //         },
    //       },
    //     ],
    //   });
    //   await alert.present();
    // } else {
    //   this.navController.back();
    // }
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
    this.lastFile = null;
    this.preuploadService.clear();
  }

  continue() {
    this.base64 = null;
    this.imageSrc = null;
    this.preview = false;
    // this.hideBackground = true;
  }

  // async uploadAndContinue() {
  //   if (!this.uploading) {
  //     this.uploading = 1;
  //     try {
  //       await this.upload();
  //       this.continue();
  //     } finally {
  //       this.uploading = 0;
  //     }
  //   }
  // }

  // async uploadAndExit() {
  //   if (!this.uploading) {
  //     this.uploading = 2;
  //     try {
  //       await this.upload();
  //       this.back();
  //     } finally {
  //       this.uploading = 0;
  //     }
  //   }
  // }

  // async upload() {
  //   if (!this.fileName) {
  //     const toast = await this.toastController.create({
  //       message: '文件名不能为空',
  //       position: 'top',
  //       duration: 2000,
  //     });
  //     toast.present();
  //     throw '文件名不能为空';
  //   }
  //   const blob = this.base64ToBlob(this.base64);
  //   const fileName = this.fileName + '.jpg';
  //   await this.baiduAPIService.upload(fileName, blob);
  // }

  // urlToBase64(url: string): Promise<string> {
  //   return new Promise((resolve, reject) => {
  //     const image = new Image();
  //     image.src = url;
  //     image.onload = () => {
  //       const canvas = document.createElement('canvas');
  //       canvas.width = image.width;
  //       canvas.height = image.height;
  //       const ctx = canvas.getContext('2d');
  //       ctx.drawImage(image, 0, 0, image.width, image.height);
  //       const ext = image.src
  //         .substring(image.src.lastIndexOf('.') + 1)
  //         .toLowerCase();
  //       let base64 = canvas.toDataURL('image/jpeg');
  //       base64 = base64.substr(base64.indexOf(',') + 1);
  //       resolve(base64);
  //     };
  //     image.onerror = (e) => {
  //       reject(e);
  //     };
  //   });
  // }

  // base64ToArrayBuffer(base64: string) {
  //   const bstr = atob(base64);
  //   let n = bstr.length;
  //   const buffer: ArrayBuffer = new Uint8Array(n);
  //   while (n--) {
  //     buffer[n] = bstr.charCodeAt(n);
  //   }
  //   return buffer;
  // }

  // base64ToBlob(dataurl) {
  //   const mime = 'image/jpeg';
  //   const bstr = atob(dataurl);
  //   let n = bstr.length;
  //   const u8arr: ArrayBuffer = new Uint8Array(n);
  //   while (n--) {
  //     u8arr[n] = bstr.charCodeAt(n);
  //   }
  //   return new Blob([u8arr], {
  //     type: mime,
  //   });
  // }

  // onInputFocus(event: Event) {
  //   console.log(event);
  //   const input = (event.target as HTMLElement).querySelector('input');
  //   if (input) {
  //     input.select();
  //   }
  // }

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

  // @HostListener('window:ionKeyboardDidShow', ['$event'])
  // keyboardDidShow(event: any) {
  //   this.zone.run(() => {
  //     this.footerStyle = {
  //       position: 'absolute',
  //       bottom: event.detail.keyboardHeight + 'px',
  //       paddingBottom: '60px',
  //       width: '100%',
  //     };
  //   });
  // }

  // @HostListener('window:ionKeyboardDidHide', ['$event'])
  // keyboardDidHide(event: any) {
  //   this.zone.run(() => {
  //     this.footerStyle = {};
  //   });
  // }

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
      const imageData = await imageToBlob(image, scale);
      const buffer = await blobToArrayBuffer(imageData);
      const item = await this.add(buffer, file.name);
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
      if (change != 0) {
        this.zoom += change;
        this.cameraPreview.setZoom(this.zoom);
        this.startTouchDistance = distance;
      }
    }
  }
}
