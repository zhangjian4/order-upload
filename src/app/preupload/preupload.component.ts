import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  AlertController,
  IonContent,
  IonInput,
  ModalController,
  NavController,
} from '@ionic/angular';
import { format } from 'date-fns';
import { take } from 'rxjs/operators';
import { BaiduAPIService } from '../core/service/baidu-api.service';
import { CommonService } from '../core/service/common.service';
import { Database, IUploadFile } from '../core/service/database.service';
import { FileService } from '../core/service/file.service';
import { OpenCVService } from '../core/service/opencv.service';
import { PreuploadService } from '../core/service/preupload.service';
import { ProgressService } from '../shared/component/progress/progress.service';
import { imageDataToBlob } from '../shared/util/image.util';
import { DirSelectComponent } from './dir-select/dir-select.component';

@Component({
  selector: 'app-preupload',
  templateUrl: './preupload.component.html',
  styleUrls: ['./preupload.component.scss'],
})
export class PreuploadComponent implements OnInit, OnDestroy {
  @ViewChild('nameInput')
  nameInput: IonInput;
  @ViewChild('content')
  content: IonContent;
  // data: IUploadFile[];
  renameId: number;
  editName: string;
  // uploading: boolean;
  // uploaded: number;
  length = 0;
  size = 0;
  dir: string;
  shortDir: string;

  constructor(
    private zone: NgZone,
    private baiduAPIService: BaiduAPIService,
    private alertController: AlertController,
    private navController: NavController,
    public preuploadService: PreuploadService,
    public modalController: ModalController,
    private fileService: FileService,
    private commonService: CommonService,
    private progressService: ProgressService
  ) {}

  ngOnInit() {
    this.reload();
    this.dir = format(new Date(), 'yyyy/MM');
  }

  ngOnDestroy(): void {
    // this.preuploadService.clear();
  }

  ionViewWillEnter() {
    this.update();
  }

  // setDir(dir: string) {
  //   this.dir = dir;
  //   if (dir === '/') {
  //     this.shortDir = '我的文件';
  //   } else {
  //     this.shortDir = dir.substr(dir.lastIndexOf('/') + 1);
  //   }
  // }

  async reload() {
    await this.preuploadService.reload();
    this.update();
    // this.preuploadService.data = data;
    // for (const item of data) {
    //   try {
    //     if (item.rect) {
    //       item.dest = await this.opencvService.transform(item.blob, item.rect);
    //     } else {
    //       const src = await this.opencvService.fromBlob(item.blob);
    //       try {
    //         const points = await this.opencvService.getPagerRect(src);
    //         if (points.length === 4) {
    //           item.rect = points;
    //           item.dest = await this.opencvService.transform(src, points);
    //         }
    //       } finally {
    //         src.delete();
    //       }
    //     }
    //     // item.rect = await this.opencvService.getPagerRect(item.blob);
    //   } catch (e) {
    //     console.error(e);
    //   }
    // }
    // this.data = data;

    // this.title = `${this.data.length}个文件(${})`;
  }

  async update() {
    this.length = this.preuploadService.data.length;
    // await this.preuploadService.updateUrls();
    // TODO
    // this.size = this.preuploadService.data.reduce(
    //   (prev, cur) => prev + (cur.dest || cur.blob).size,
    //   0
    // );
  }

  async remove(item: IUploadFile) {
    if (await this.commonService.confirm('是否确认删除？')) {
      await this.preuploadService.remove(item, true);
      this.length = this.preuploadService.data.length;
      if (this.length === 0) {
        this.navController.navigateBack('/camera');
      } else {
        this.update();
      }
    }
  }

  rename(item: IUploadFile) {
    if (this.renameId !== item.id) {
      this.renameId = item.id;
      this.editName = item.name;
      const selected: HTMLElement = document.querySelector(
        `div[item-id='${item.id}']`
      );
      console.log(selected.offsetTop);
      this.content.scrollToPoint(0, selected.offsetTop, 200);
      this.zone.onStable.pipe(take(1)).subscribe(async () => {
        if (this.nameInput) {
          await this.nameInput.setFocus();
          const element = await this.nameInput.getInputElement();
          element.select();
          // setTimeout(() => {
          //   element.scrollIntoView();
          // });
        }
      });
    }
  }

  async renameEnd(item: IUploadFile) {
    this.renameId = null;
    if (this.editName) {
      await this.preuploadService.rename(item, this.editName);
      // item.name = this.editName;
      // await this.database.preuploadFile.update(item.id, {
      //   name: this.editName,
      // });
    }
  }

  onKeydown(item: IUploadFile, event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.renameEnd(item);
    }
  }

  async selectDir() {
    const modal = await this.modalController.create({
      component: DirSelectComponent,
      componentProps: {
        dir: '/',
        handler: (dir: string) => {
          this.dir = dir;
          this.save();
        },
      },
      cssClass: 'my-custom-class',
    });
    return await modal.present();
  }

  async save() {
    // if (this.dir === '/') {
    //   this.commonService.alert('不能上传到根目录');
    //   return;
    // }
    let uploaded = 0;
    // this.uploading = true;
    const progress = await this.progressService.create('正在上传');
    for (let i = 0; i < this.preuploadService.data.length; i++) {
      const item = this.preuploadService.data[i];
      try {
        // await this.sleep(3000);
        const imageId = item.dest || item.origin;
        const imageData = await this.preuploadService.getImageData(imageId);
        // const blob = await imageDataToBlob(imageData);
        const blob = new Blob([imageData], { type: 'image/jpeg' });
        await this.baiduAPIService.upload(this.dir, item.name + '.jpg', blob);
        this.preuploadService.remove(item);
        uploaded++;
        progress.next(uploaded / this.preuploadService.data.length);
      } catch (e) {
        alert(e);
        const select = await this.retryConfirm(i);
        if (select === 'retry') {
          i--;
        } else if (select === 'skip') {
          continue;
        } else {
          break;
        }
      }
    }
    progress.complete();
    // this.uploading = false;
    await this.reload();
    if (this.preuploadService.data.length === 0) {
      this.fileService.setDir(this.dir);
      this.preuploadService.clear();
      this.navController.navigateRoot('/main');
    } else {
      this.update();
    }
  }

  retryConfirm(index: number) {
    return new Promise<string>(async (resolve) => {
      const alert = await this.alertController.create({
        message: `第${index + 1}张照片上传失败，是否重试？`,
        backdropDismiss: false,
        buttons: [
          {
            text: '重试',
            handler: () => {
              resolve('retry');
            },
          },
          {
            text: '跳过',
            handler: () => {
              resolve('skip');
            },
          },
          {
            text: '取消',
            role: 'cancel',
            handler: () => {
              resolve('cancel');
            },
          },
        ],
      });
      await alert.present();
    });
  }

  trackItems(index: number, item: any) {
    return item.id;
  }
}
