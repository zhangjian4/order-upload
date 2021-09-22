import {
  Component,
  ElementRef,
  NgZone,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
import {
  CodePush,
  InstallMode,
  IRemotePackage,
  SyncStatus,
} from '@ionic-native/code-push/ngx';
import { VERSION } from '../core/version';
import { Storage } from '@ionic/storage-angular';
import { formatFileSize } from '../shared/util/unit.util';

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
  remotePackage: IRemotePackage;
  showProgress: boolean;
  progress: number;
  dir = '/';
  constructor(
    private baiduAPIService: BaiduAPIService,
    public fileService: FileService,
    private codePush: CodePush,
    private zone: NgZone,
    public alertController: AlertController,
    public toastController: ToastController,
    public loadingController: LoadingController,
    private storage: Storage,
    private router: Router,
    private route: ActivatedRoute
  ) {
    route.queryParams.subscribe((params) => {
      const dir = params.dir || '/';
      if (this.dir != dir) {
        this.dir = dir;
        this.initLoading();
      }
    });
  }

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
      await this.fileService.reload(this.dir);
    } finally {
      this.loading = false;
    }
  }

  async reloadUserInfo() {
    //先从缓存中获取，再从接口获取
    this.userInfo = await this.storage.get('userInfo');
    this.userInfo = await this.baiduAPIService.getUserInfo();
    this.storage.set('userInfo', this.userInfo);
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
      this.remotePackage = remote;
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

    if (this.remotePackage != null) {
      const size = formatFileSize(this.remotePackage.packageSize);
      const alert = await this.alertController.create({
        header: '更新',
        message: `检测到新版本，是否立即更新?
(更新包大小${size}，建议在wifi下更新)`,
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
                  this.zone.run(() => {
                    this.progress =
                      progress.receivedBytes / progress.totalBytes;
                  });
                })
                .subscribe((status) => {
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

  async logout() {
    const alert = await this.alertController.create({
      message: `是否确认退出登录？`,
      backdropDismiss: false,
      buttons: [
        {
          text: '取消',
          role: 'cancel',
        },
        {
          text: '确定',
          handler: () => {
            this.baiduAPIService.logout();
          },
        },
      ],
    });
    await alert.present();
  }

  trackItems(index: number, item: any) {
    return item.fs_id;
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

  detail(item: any, index: number) {
    if (item.isdir) {
      this.router.navigate(['/', 'main'], { queryParams: { dir: item.path } });
    } else if (item.thumbs) {
      this.router.navigate(['/detail'], { queryParams: { index } });
    }
  }
}
