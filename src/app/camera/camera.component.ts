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

@Component({
  selector: 'app-camera',
  templateUrl: './camera.component.html',
  styleUrls: ['./camera.component.scss'],
})
export class CameraComponent implements OnInit, OnDestroy {
  @HostBinding('class.hide-background')
  hideBackground: boolean;
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
  lastFileId: number;
  constructor(
    private cameraPreview: CameraPreview,
    private zone: NgZone,
    private navController: NavController,
    private webview: WebView,
    private baiduAPIService: BaiduAPIService,
    private platform: Platform,
    public toastController: ToastController,
    public alertController: AlertController,
    private indexedDBService: IndexedDBService,
    private database: Database
  ) {}

  async ngOnInit() {
    this.startCamera();
    this.clear();
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
      this.hideBackground = true;
    });
  }

  async stopCamera() {
    await this.cameraPreview.stopCamera();
    this.zone.run(() => {
      this.hideBackground = false;
    });
  }

  async takePicture() {
    let base64: string;
    if (this.platform.is('cordova')) {
      base64 = await this.cameraPreview.takePicture({ quality: 100 });
    } else {
      base64 = await this.urlToBase64('/assets/img/lake.jpg');
    }
    const blob = this.base64ToBlob(base64);
    const name = format(new Date(), 'yyyyMMddHHmmssSSS');
    this.photoCount++;
    this.lastFileId = await this.database.preuploadFile.add({ name, blob });
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

  async back() {
    if (this.photoCount) {
      const alert = await this.alertController.create({
        cssClass: 'my-custom-class',
        message: '放弃拍摄的' + this.photoCount + '张图片?',
        buttons: [
          {
            text: '取消',
            role: 'cancel',
            cssClass: 'secondary',
          },
          {
            text: '放弃',
            handler: () => {
              this.clear();
              this.navController.back();
            },
          },
        ],
      });
      await alert.present();
    } else {
      this.navController.back();
    }
  }

  clear() {
    this.photoCount = 0;
    this.lastFileId = null;
    this.database.preuploadFile.clear();
  }

  continue() {
    this.base64 = null;
    this.imageSrc = null;
    this.preview = false;
    this.hideBackground = true;
  }

  async uploadAndContinue() {
    if (!this.uploading) {
      this.uploading = 1;
      try {
        await this.upload();
        this.continue();
      } finally {
        this.uploading = 0;
      }
    }
  }

  async uploadAndExit() {
    if (!this.uploading) {
      this.uploading = 2;
      try {
        await this.upload();
        this.back();
      } finally {
        this.uploading = 0;
      }
    }
  }

  async upload() {
    if (!this.fileName) {
      const toast = await this.toastController.create({
        message: '文件名不能为空',
        position: 'top',
        duration: 2000,
      });
      toast.present();
      throw '文件名不能为空';
    }
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

  onInputFocus(event: Event) {
    console.log(event);
    const input = (event.target as HTMLElement).querySelector('input');
    if (input) {
      input.select();
    }
  }

  @HostListener('window:ionKeyboardDidShow', ['$event'])
  keyboardDidShow(event: any) {
    this.zone.run(() => {
      this.footerStyle = {
        position: 'absolute',
        bottom: event.detail.keyboardHeight + 'px',
        paddingBottom: '60px',
        width: '100%',
      };
    });
  }

  @HostListener('window:ionKeyboardDidHide', ['$event'])
  keyboardDidHide(event: any) {
    this.zone.run(() => {
      this.footerStyle = {};
    });
  }
}
