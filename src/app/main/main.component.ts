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
  MenuController,
} from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
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
  // fileList: any[] = [];
  // page = 0;
  // num = 20;
  loading: boolean;
  // loadEnd: boolean;
  // syncObj: any;
  searchValue: string;
  skeletons = new Array(10);
  destroy$ = new Subject();
  dirty: boolean;
  version = VERSION;
  updateAvailable: boolean = true;
  constructor(
    private baiduAPIService: BaiduAPIService,
    private router: Router,
    public fileService: FileService,
    private codePush: CodePush,
    private zone: NgZone,
    public alertController: AlertController
  ) {}

  ngOnInit() {
    this.reloadUserInfo();
    this.initLoading();
    this.checkForUpdate();
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
    // await this.checkForUpdate();
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
              // this.process.show();
              // this.codePush
              //   .sync({ installMode: InstallMode.IMMEDIATE }, (progress) => {
              //     console.log(
              //       `Downloaded ${progress.receivedBytes} of ${progress.totalBytes}`
              //     );
              //     this.process.updateProcess(
              //       (progress.receivedBytes / progress.totalBytes) * 100
              //     );
              //   })
              //   .subscribe((status) => {
              //     console.log('SyncStatus', status);
              //     switch (status) {
              //       case SyncStatus.DOWNLOADING_PACKAGE:
              //         // this.updateModalDisplay = true;
              //         break;
              //       case SyncStatus.INSTALLING_UPDATE:
              //         // this.updateModalDisplay = false;
              //         break;
              //       case SyncStatus.ERROR:
              //         this.process.close();
              //         // this.updateModalDisplay = false;
              //         this.toast.fail('更新失败', 1000, null, false);
              //         break;
              //     }
              //   });
            },
          },
        ],
      });

      await alert.present();
      // this.modal.alert('更新', '检测到新版本，是否立即更新?', [
      //   { text: '取消' },
      //   {
      //     text: '确定',
      //     onPress: () => {
      //       this.process.show();
      //       this.codePush
      //         .sync({ installMode: InstallMode.IMMEDIATE }, (progress) => {
      //           console.log(
      //             `Downloaded ${progress.receivedBytes} of ${progress.totalBytes}`
      //           );
      //           this.process.updateProcess(
      //             (progress.receivedBytes / progress.totalBytes) * 100
      //           );
      //         })
      //         .subscribe((status) => {
      //           console.log('SyncStatus', status);
      //           switch (status) {
      //             case SyncStatus.DOWNLOADING_PACKAGE:
      //               // this.updateModalDisplay = true;
      //               break;
      //             case SyncStatus.INSTALLING_UPDATE:
      //               // this.updateModalDisplay = false;
      //               break;
      //             case SyncStatus.ERROR:
      //               this.process.close();
      //               // this.updateModalDisplay = false;
      //               this.toast.fail('更新失败', 1000, null, false);
      //               break;
      //           }
      //         });
      //     },
      //   },
      // ]);
    }
  }

  logout() {
    this.baiduAPIService.logout();
  }
}
