import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonInfiniteScroll, MenuController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { BaiduAPIService } from '../core/service/baidu-api.service';
import { FileService } from '../core/service/file.service';

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

  constructor(
    private menu: MenuController,
    private baiduAPIService: BaiduAPIService,
    private router: Router,
    public fileService: FileService
  ) {}

  ngOnInit() {
    this.reloadUserInfo();
    this.initLoading();
    // this.baiduAPIService.fileChange
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe(() => {
    //     this.dirty = true;
    //   });
  }

  ionViewWillEnter() {
    if (this.fileService.dirty) {
      this.initLoading();
    }
  }

  async initLoading() {
    // this.page = 0;
    // this.loadEnd = false;
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
    // this.page = 0;
    // this.loadEnd = false;
    try {
      await this.fileService.reload();
    } catch (e) {
      console.error(e);
    }
    // this.infiniteScroll.nativeElement.disabled = false;
    // console.log(this.infiniteScroll.nativeElement);
    event.target.complete();
  }

  async loadMore(event: any) {
    try {
      await this.fileService.loadNextPage();
    } finally {
      event.target.complete();
    }
  }

  // async loadData(event?: any) {
  //   const syncObj = new Object();
  //   this.syncObj = syncObj;
  //   try {
  //     let list: any[];
  //     let hasMore: boolean;
  //     if (this.searchValue) {
  //       const result = await this.baiduAPIService.search(
  //         this.searchValue,
  //         this.page + 1,
  //         this.num
  //       );
  //       list = result.list;
  //       hasMore = result.has_more;
  //     } else {
  //       const result = await this.baiduAPIService.getFileList(
  //         this.page * this.num,
  //         this.num
  //       );
  //       list = result.list;
  //       hasMore = list.length === this.num;
  //     }
  //     if (this.syncObj !== syncObj) {
  //       return;
  //     }
  //     if (!hasMore) {
  //       this.loadEnd = true;
  //     }
  //     if (this.page === 0) {
  //       this.fileList = [];
  //       this.dirty = false;
  //     }
  //     this.fileList.push(...list);
  //     this.page = this.page + 1;
  //   } finally {
  //     if (event) {
  //       event.target.complete();
  //     }
  //   }
  // }

  async search(event: any) {
    this.content.scrollToTop();
    this.fileService.searchValue = event.detail.value;
    this.initLoading();
    // this.search$.next(value);
  }
  openFirst() {
    this.menu.open('first');
  }

  logout() {
    this.baiduAPIService.logout();
  }

  takePhoto() {
    this.router.navigateByUrl('/camera');
  }

  detail(item: any, index: number) {
    this.router.navigate(['/detail'], {
      queryParams: { id: item.fs_id, index },
    });
  }
}
