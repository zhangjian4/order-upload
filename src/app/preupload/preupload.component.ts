import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { AlertController, IonInput, NavController } from '@ionic/angular';
import { take } from 'rxjs/operators';
import { BaiduAPIService } from '../core/service/baidu-api.service';
import { Database, IUploadFile } from '../core/service/database.service';

@Component({
  selector: 'app-preupload',
  templateUrl: './preupload.component.html',
  styleUrls: ['./preupload.component.scss'],
})
export class PreuploadComponent implements OnInit {
  @ViewChild('nameInput')
  nameInput: IonInput;
  data: IUploadFile[];
  renameId: number;
  editName: string;
  uploading: boolean;
  uploaded: number;

  constructor(
    private database: Database,
    private zone: NgZone,
    private baiduAPIService: BaiduAPIService,
    private alertController: AlertController,
    private navController: NavController
  ) {}

  ngOnInit() {
    this.reload();
  }

  async reload() {
    this.data = await this.database.preuploadFile.toArray();
  }

  rename(item: IUploadFile) {
    if (this.renameId !== item.id) {
      this.renameId = item.id;
      this.editName = item.name;
      this.zone.onStable.pipe(take(1)).subscribe(async () => {
        console.log(this.nameInput);
        if (this.nameInput) {
          await this.nameInput.setFocus();
          const element = await this.nameInput.getInputElement();
          element.select();
        }
      });
    }
  }

  async renameEnd(item: IUploadFile) {
    this.renameId = null;
    if (this.editName) {
      await this.database.preuploadFile.update(item.id, {
        name: this.editName,
      });
      item.name = this.editName;
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
        await this.baiduAPIService.upload(item.name + '.jpg', item.blob);
        await this.database.preuploadFile.delete(item.id);
        this.uploaded++;
      } catch (e) {
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
}
