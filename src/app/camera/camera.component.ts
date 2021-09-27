import {
  Component,
  HostBinding,
  HostListener,
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
import { Database } from '../core/service/database.service';
import { CanConfirm } from '../shared/router-guard/can-confirm.interface';
import { ActivatedRoute, RouterStateSnapshot } from '@angular/router';
import * as SparkMD5 from 'spark-md5';
import {
  base64ToArrayBuffer,
  base64ToBlob,
  urlToBlob,
} from '../shared/util/image.util';
import { OpenCVService } from '../core/service/opencv.service';
import { PreuploadService } from '../core/service/preupload.service';

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss'],
})
export class CameraComponent implements CanConfirm, OnInit, OnDestroy {
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
  lastFile: Blob;
  viewEntered: boolean;
  cameraStarted: boolean;
  promises: Promise<any>[] = [];
  id: number;
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
    private preuploadService: PreuploadService
  ) {
    this.route.params.subscribe((params) => {
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
    this.photoCount = await this.database.preuploadFile.count();
    if (this.photoCount > 0) {
      const last = await this.database.preuploadFile.toCollection().last();
      this.lastFile = last.blob;
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
    // this.stopCamera();
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
      this.cameraStarted = true;
    });
  }

  async stopCamera() {
    await this.cameraPreview.stopCamera();
    this.zone.run(() => {
      this.cameraStarted = false;
    });
  }

  async takePicture() {
    let blob: Blob;
    if (this.platform.is('cordova')) {
      const base64 = await this.cameraPreview.takeSnapshot({ quality: 100 });
      blob = base64ToBlob(base64);
    } else {
      blob = await urlToBlob(`/assets/img/test${this.photoCount % 5}.jpg`);
    }
    if (this.id) {
      this.preuploadService.updateBlob(this.id, blob);
      // await this.database.preuploadFile.update(this.id, { blob });
      this.back();
    } else {
      const name = format(new Date(), 'yyyyMMddHHmmssSSS');
      this.photoCount++;
      this.lastFile = blob;
      const id = await this.database.preuploadFile.add({
        name,
        blob,
      });
      this.promises.push(this.handlePhoto(id, blob));
    }
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

  async handlePhoto(id: number, blob: Blob) {
    const src = await this.opencvService.fromBlob(blob);
    try {
      const rect = await this.opencvService.getPagerRect(src);
      if (rect.length === 4) {
        const dest = await this.opencvService.transform(src, rect);
        await this.database.preuploadFile.update(id, { rect, dest });
      }
      // await this.sleep();
    } catch (e) {
      console.error(e);
    } finally {
      src.delete();
    }
  }

  sleep() {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

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
    await Promise.all(this.promises);
    this.navController.navigateForward('/preupload');
  }

  clear() {
    this.photoCount = 0;
    this.lastFile = null;
    this.database.preuploadFile.clear();
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
    const count = await this.database.preuploadFile.count();
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
}
