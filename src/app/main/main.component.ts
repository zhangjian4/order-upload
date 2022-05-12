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
  Platform,
  ToastController,
} from '@ionic/angular';
import { Subject } from 'rxjs';
import { BaiduAPIService } from '../core/service/baidu-api.service';
import { FileService } from '../core/service/file.service';
import { VERSION } from '../core/version';
import { Storage } from '@ionic/storage-angular';
import { formatFileSize } from '../shared/util/unit.util';
import { CommonService } from '../core/service/common.service';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { HttpService } from '../core/service/http.service';

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
  remotePackage: any;
  showProgress: boolean;
  progress: number;
  // dir = '/';
  backSub: any;
  token='41ba9dc7a1b570cfdd40bcb22d9c6997'
  constructor(
    private baiduAPIService: BaiduAPIService,
    public fileService: FileService,
    // private codePush: CodePush,
    private zone: NgZone,
    private storage: Storage,
    private router: Router,
    private platform: Platform,
    private commonService: CommonService,
    public loadingController: LoadingController,
    private httpService: HttpService
  ) {
    // route.queryParams.subscribe((params) => {
    //   const dir = params.dir || '/';
    //   if (this.dir !== dir) {
    //     this.dir = dir;
    //     this.initLoading();
    //   }
    // });
  }

  ngOnInit() {
    CapacitorUpdater.notifyAppReady();
    this.reloadUserInfo();
    this.initLoading();
    this.checkForUpdate();
    // this.codePush.notifyApplicationReady();
  }

  ionViewWillLeave() {
    if (this.backSub) {
      this.backSub.unsubscribe();
      this.backSub = null;
    }
  }

  ionViewWillEnter() {
    this.backSub = this.platform.backButton.subscribeWithPriority(10, () => {
      this.back();
    });
    if (this.fileService.dirty) {
      this.initLoading();
    }
  }

  async initLoading(dir?: string) {
    this.loading = true;
    try {
      await this.fileService.reload(dir);
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
    if (this.platform.is('capacitor')) {
      const lastes = await this.httpService.get(
        'https://gitee.com/api/v5/repos/zhangj1992/order-upload/releases/latest'
      );
      if (lastes.tag_name !== VERSION) {
        this.remotePackage = lastes;
      }
    }
  }

  async update() {
    //https://gitee.com/api/v5/repos/zhangj1992/order-upload/releases/latest
    // const version = await CapacitorUpdater.download({
    //   url: 'https://gitee.com/zhangj1992/order-upload/attach_files/1056794/download/www.zip',
    // });
    // await CapacitorUpdater.set(version);
    try {
      await this.commonService.loading('正在检查更新', () =>
        this.checkForUpdate()
      );
    } catch (e) {
      console.error(e);
      this.commonService.toast('检查更新失败');
      return;
    }
    if (this.remotePackage != null) {
      // const size = formatFileSize(this.remotePackage.packageSize);
      const confirm = await this.commonService.confirm(
        `检测到新版本，是否立即更新?(建议在wifi下更新)`
      );
      if (confirm) {
        // const loading = await this.loadingController.create({
        //   message: '正在更新...',
        // });
        // await loading.present();
        this.showProgress = true;
        this.progress = 0;
        const listener = await CapacitorUpdater.addListener(
          'download',
          (state) => {
            this.zone.run(() => {
              this.progress = state.percent / 100;
              if (this.progress > 1) {
                this.progress = 0.5;
              }
            });
          }
        );
        try {
          const version = await CapacitorUpdater.download({
            url: this.remotePackage.assets[0].browser_download_url,
          });
          CapacitorUpdater.set(version);
        } catch (e) {
          console.error(e);
          this.commonService.toast('更新失败');
        } finally {
          this.showProgress = false;
          listener.remove();
        }

        // this.codePush
        //   .sync({ installMode: InstallMode.IMMEDIATE }, (progress) => {
        //     // this.zone.run(() => {
        //     //   this.progress = progress.receivedBytes / progress.totalBytes;
        //     // });
        //   })
        //   .subscribe((status) => {
        //     switch (status) {
        //       case SyncStatus.DOWNLOADING_PACKAGE:
        //         break;
        //       case SyncStatus.INSTALLING_UPDATE:
        //         break;
        //       case SyncStatus.ERROR:
        //         this.zone.run(() => {
        //           // this.showProgress = false;
        //           loading.dismiss();
        //           this.commonService.toast('更新失败');
        //         });
        //         break;
        //     }
        //   });
      }
    } else {
      this.commonService.toast('当前已是最新版本');
    }
  }

  async logout() {
    if (await this.commonService.confirm('是否确认退出登录？')) {
      this.baiduAPIService.logout();
    }
  }

  trackItems(index: number, item: any) {
    return item.fs_id;
  }

  // async toast(message: string) {
  //   const toast = await this.toastController.create({
  //     message,
  //     duration: 2000,
  //     position: 'middle',
  //     color: 'dark',
  //   });
  //   toast.present();
  // }

  detail(item: any, id: number) {
    if (item.isdir) {
      this.initLoading(item.path);
      // this.router.navigate(['/', 'main'], { queryParams: { dir: item.path } });
    } else if (item.thumbs) {
      this.router.navigate(['/detail'], { queryParams: { id } });
    }
  }

  back() {
    let dir = this.fileService.dir;
    if (dir !== '/') {
      dir = dir.substr(0, dir.lastIndexOf('/'));
      if (dir === '') {
        dir = '/';
      }
      this.initLoading(dir);
    }
  }
}
