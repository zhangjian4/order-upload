import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { IonInfiniteScroll, MenuController } from '@ionic/angular';
import { BaiduAPIService } from '../core/service/baidu-api.service';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
  @ViewChild('infiniteScroll', { read: ElementRef })
  infiniteScroll: ElementRef;
  userInfo: any;
  fileList: any[] = [];
  start = 0;
  limit = 10;
  loading: boolean;
  loadEnd: boolean;

  constructor(
    private menu: MenuController,
    private baiduAPIService: BaiduAPIService
  ) {}

  ngOnInit() {
    this.reloadUserInfo();
    this.loadData();
  }

  async reloadUserInfo() {
    this.userInfo = await this.baiduAPIService.getUserInfo();
  }

  async doRefresh(event?: any) {
    this.start = 0;
    try {
      await this.loadData();
    } catch (e) {
      console.error(e);
    }
    this.loadEnd = false;
    // this.infiniteScroll.nativeElement.disabled = false;
    // console.log(this.infiniteScroll.nativeElement);
    event.target.complete();
  }

  async loadData(event?: any) {
    console.log(event);
    if (!this.loading) {
      this.loading = true;
      try {
        const result = await this.baiduAPIService.getFileList(
          this.start,
          this.limit
        );
        const list = result.list;
        if (list.length < this.limit) {
          this.loadEnd = true;
        }
        if (this.start === 0) {
          this.fileList = [];
        }
        this.fileList.push(...list);
        this.start = this.start + list.length;
      } finally {
        if (event) {
          event.target.complete();
        }
        this.loading = false;
      }
    }
  }

  openFirst() {
    this.menu.open('first');
  }

  logout() {
    this.baiduAPIService.logout();
  }

  openEnd() {
    this.menu.open('end');
  }

  openCustom() {
    this.menu.enable(true, 'custom');
    this.menu.open('custom');
  }
}
