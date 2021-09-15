import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import {
  AlertController,
  IonContent,
  IonInput,
  NavController,
} from '@ionic/angular';
import { take } from 'rxjs/operators';
import { BaiduAPIService } from '../core/service/baidu-api.service';
import { Database, IUploadFile } from '../core/service/database.service';
import { OpenCVService } from '../core/service/opencv.service';
import { PreuploadService } from './preupload.service';

@Component({
  selector: 'app-preupload',
  templateUrl: './preupload.component.html',
  styleUrls: ['./preupload.component.scss'],
})
export class PreuploadComponent implements OnInit {
  @ViewChild('nameInput')
  nameInput: IonInput;
  @ViewChild('content')
  content: IonContent;
  data: IUploadFile[];
  renameId: number;
  editName: string;
  uploading: boolean;
  uploaded: number;
  length = 0;
  size = 0;

  constructor(
    private database: Database,
    private zone: NgZone,
    private baiduAPIService: BaiduAPIService,
    private alertController: AlertController,
    private navController: NavController,
    private preuploadService: PreuploadService,
    private opencvService:OpenCVService
  ) {}

  ngOnInit() {
    this.reload();
  }

  async reload() {
    const data = await this.database.preuploadFile.toArray();
    for(const item of data){

    }
    this.data=data;
    this.length = this.data.length;
    this.size = this.data.reduce((prev, cur) => prev + cur.blob.size, 0);
    // this.title = `${this.data.length}个文件(${})`;
  }

  async remove(item: IUploadFile) {
    const alert = await this.alertController.create({
      message: `是否确认删除？`,
      backdropDismiss: false,
      buttons: [
        {
          text: '取消',
          role: 'cancel',
        },
        {
          text: '确定',
          handler: async () => {
            await this.database.preuploadFile.delete(item.id);
            this.reload();
          },
        },
      ],
    });
    await alert.present();
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
      item.name = this.editName;
      await this.database.preuploadFile.update(item.id, {
        name: this.editName,
      });
    }
  }

  onKeydown(item: IUploadFile, event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.renameEnd(item);
    }
  }

  async save() {
    this.uploaded = 0;
    this.uploading = true;
    for (let i = 0; i < this.data.length; i++) {
      const item = this.data[i];
      try {
        // await this.sleep(3000);
        await this.baiduAPIService.upload(
          item.name + '.jpg',
          item.blob,
          item.md5
        );
        await this.database.preuploadFile.delete(item.id);
        this.uploaded++;
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
    this.uploading = false;
    await this.reload();
    if (this.data.length === 0) {
      this.navController.navigateRoot('/main');
    }
  }

  sleep(time: number) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        reject();
      }, time);
    });
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
