import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent, IonInfiniteScroll, MenuController } from '@ionic/angular';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { BaiduAPIService } from '../core/service/baidu-api.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  @ViewChild('content')
  content: IonContent;
  userInfo: any;
  fileList: any[] = [];
  page = 0;
  num = 10;
  loading: boolean;
  loadEnd: boolean;
  syncObj: any;
  searchValue: string;
  skeletons = new Array(10);

  constructor(
    private menu: MenuController,
    private baiduAPIService: BaiduAPIService,
    private router: Router
  ) {}

  ngOnInit() {
    this.reloadUserInfo();
    this.initLoading();
  }

  async initLoading() {
    this.page = 0;
    this.loadEnd = false;
    this.loading = true;
    try {
      await this.loadData();
    } finally {
      this.loading = false;
    }
  }

  async reloadUserInfo() {
    this.userInfo = await this.baiduAPIService.getUserInfo();
  }

  async doRefresh(event?: any) {
    this.page = 0;
    this.loadEnd = false;
    try {
      await this.loadData();
    } catch (e) {
      console.error(e);
    }
    // this.infiniteScroll.nativeElement.disabled = false;
    // console.log(this.infiniteScroll.nativeElement);
    event.target.complete();
  }

  async loadData(event?: any) {
    const syncObj = new Object();
    this.syncObj = syncObj;
    try {
      let list: any[];
      let hasMore: boolean;
      if (this.searchValue) {
        const result = await this.baiduAPIService.search(
          this.searchValue,
          this.page + 1,
          this.num
        );
        list = result.list;
        hasMore = result.has_more;
      } else {
        const result = await this.baiduAPIService.getFileList(
          this.page * this.num,
          this.num
        );
        list = result.list;
        hasMore = list.length === this.num;
      }
      if (this.syncObj !== syncObj) {
        return;
      }
      if (!hasMore) {
        this.loadEnd = true;
      }
      if (this.page === 0) {
        this.fileList = [];
      }
      this.fileList.push(...list);
      this.page = this.page + 1;
    } finally {
      if (event) {
        event.target.complete();
      }
    }
  }

  async search(event: any) {
    this.content.scrollToTop();
    this.searchValue = event.detail.value;
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
}
