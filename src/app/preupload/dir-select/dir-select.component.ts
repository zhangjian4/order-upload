import { Component, OnInit } from '@angular/core';
import {
  AlertController,
  ModalController,
  ToastController,
} from '@ionic/angular';
import { BaiduAPIService } from 'src/app/core/service/baidu-api.service';

@Component({
  selector: 'app-dir-select',
  templateUrl: './dir-select.component.html',
  styleUrls: ['./dir-select.component.scss'],
})
export class DirSelectComponent implements OnInit {
  dir: string;
  loading: boolean;
  skeletons = new Array(10);
  fileList = [];
  handler: (dir: string) => void;
  constructor(
    public modalController: ModalController,
    private baiduAPIService: BaiduAPIService,
    public alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.reload(true);
  }

  async refresh(event: any) {
    try {
      await this.reload(false);
    } finally {
      event.target.complete();
    }
  }

  async reload(showLoading?: boolean) {
    if (showLoading) {
      this.loading = true;
    }
    try {
      const result = await this.baiduAPIService.getFileList(
        this.dir,
        0,
        10000,
        '1'
      );
      this.fileList = result.list;
    } finally {
      this.loading = false;
    }
  }

  open(dir: any) {
    this.dir = dir;
    this.reload(true);
  }

  back() {
    if (this.dir !== '/') {
      this.dir = this.dir.substr(0, this.dir.lastIndexOf('/'));
      if (this.dir === '') {
        this.dir = '/';
      }
      this.reload(true);
    }
  }

  async createDir() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: '新建文件夹',
      inputs: [
        {
          name: 'name',
          type: 'text',
        },
      ],
      buttons: [
        {
          text: '取消',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: '确定',
          handler: ({ name }) => {
            if (!name) {
              this.toast('文件名不能为空');
              return false;
            } else {
              const path =
                this.dir === '/' ? '/' + name : this.dir + '/' + name;
              if (this.fileList.some((item) => item.path === path)) {
                this.toast('文件名已存在');
                return false;
              } else {
                this.baiduAPIService.create(path, 0, '1').then(() => {
                  this.open(path);
                });
              }
            }
          },
        },
      ],
    });

    await alert.present();
  }

  dismiss() {
    this.modalController.dismiss({
      dismissed: true,
    });
  }

  async toast(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'middle',
      color: 'dark',
    });
    toast.present();
  }

  confirm() {
    if (this.handler) {
      this.handler(this.dir);
    }
    this.dismiss();
  }
}
