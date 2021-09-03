import {
  Component,
  ElementRef,
  NgZone,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  AlertController,
  IonContent,
  IonInfiniteScroll,
  LoadingController,
  MenuController,
  ToastController,
} from '@ionic/angular';
import { Subject } from 'rxjs';
import { BaiduAPIService } from '../core/service/baidu-api.service';
import { FileService } from '../core/service/file.service';
import { CodePush, InstallMode, SyncStatus } from '@ionic-native/code-push/ngx';
import { VERSION } from '../core/version';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  @ViewChild('content')
  content: IonContent;
  userInfo: any;
  loading: boolean;
  searchValue: string;
  skeletons = new Array(10);
  destroy$ = new Subject();
  dirty: boolean;
  version = VERSION;
  updateAvailable: boolean;
  showProgress: boolean;
  progress: number;
  constructor(
    private baiduAPIService: BaiduAPIService,
    public fileService: FileService,
    private codePush: CodePush,
    private zone: NgZone,
    public alertController: AlertController,
    public toastController: ToastController,
    public loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.reloadUserInfo();
    this.initLoading();
    this.checkForUpdate();
    this.codePush.notifyApplicationReady();
  }

  ionViewWillEnter() {
    if (this.fileService.dirty) {
      this.initLoading();
    }
  }

  async initLoading() {
    this.loading = true;
    try {
      await this.fileService.reload();
    } finally {
      this.loading = false;
    }
  }

  async reloadUserInfo() {
    this.userInfo = await this.baiduAPIService.getUserInfo();
  }

  async doRefresh(event?: any) {
    try {
      await this.fileService.reload();
    } catch (e) {
      console.error(e);
    }
    event.target.complete();
  }

  async loadMore(event: any) {
    try {
      await this.fileService.loadNextPage();
    } finally {
      event.target.complete();
    }
  }

  async search(event: any) {
    this.content.scrollToTop();
    this.fileService.searchValue = event.detail.value;
    this.initLoading();
  }

  async checkForUpdate() {
    const remote = await this.codePush.checkForUpdate();
    this.zone.run(() => {
      this.updateAvailable = remote != null;
    });
  }

  async update() {
    const loading = await this.loadingController.create({
      message: '正在检查更新',
    });
    loading.present();
    try {
      await this.checkForUpdate();
    } catch (e) {
      console.error(e);
      this.toast('检查更新失败');
      return;
    } finally {
      loading.dismiss();
    }

    if (this.updateAvailable) {
      const alert = await this.alertController.create({
        cssClass: 'my-custom-class',
        header: '更新',
        message: '检测到新版本，是否立即更新?',
        buttons: [
          {
            text: '取消',
            role: 'cancel',
            cssClass: 'secondary',
          },
          {
            text: '确定',
            handler: () => {
              this.showProgress = true;
              this.progress = 0;
              this.codePush
                .sync({ installMode: InstallMode.IMMEDIATE }, (progress) => {
                  console.log(
                    `Downloaded ${progress.receivedBytes} of ${progress.totalBytes}`
                  );
                  this.zone.run(() => {
                    this.progress =
                      progress.receivedBytes / progress.totalBytes;
                  });
                })
                .subscribe((status) => {
                  console.log('SyncStatus', status);
                  switch (status) {
                    case SyncStatus.DOWNLOADING_PACKAGE:
                      break;
                    case SyncStatus.INSTALLING_UPDATE:
                      break;
                    case SyncStatus.ERROR:
                      this.zone.run(() => {
                        this.showProgress = false;
                        this.toast('更新失败');
                      });
                      break;
                  }
                });
            },
          },
        ],
      });
      await alert.present();
    } else {
      this.toast('当前已是最新版本');
    }
  }

  logout() {
    this.baiduAPIService.logout();
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
}
