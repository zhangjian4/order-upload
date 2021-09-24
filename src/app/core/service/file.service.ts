import { Injectable } from '@angular/core';
import { BaiduAPIService } from './baidu-api.service';
import { IndexedDBService } from './indexeddb.service';

@Injectable({ providedIn: 'root' })
export class FileService {
  syncObj: any;
  searchValue: string;
  page = -1;
  num = 1000;
  hasMore = true;
  fileList: any[] = [];
  dirty: boolean;
  loading: boolean;
  dir = '/';
  constructor(
    private baiduAPIService: BaiduAPIService,
    private indexedDBService: IndexedDBService
  ) {
    this.baiduAPIService.fileChange.subscribe(() => {
      this.dirty = true;
    });
  }

  async loadData(page: number) {
    let list: any[];
    let hasMore: boolean;
    const syncObj = new Object();
    this.syncObj = syncObj;
    const start = page * this.num;
    try {
      this.loading = true;
      if (this.searchValue) {
        const result = await this.baiduAPIService.search(
          this.dir,
          this.searchValue,
          page + 1,
          this.num
        );
        list = result.list;
        hasMore = result.has_more;
      } else {
        const result = await this.baiduAPIService.getFileList(
          this.dir,
          start,
          this.num
        );
        list = result.list;
        hasMore = list.length === this.num;
      }
      if (this.syncObj !== syncObj) {
        return;
      }
      this.hasMore = hasMore;
      if (this.fileList.length > start) {
        this.fileList.splice(start);
      }
      if (page === 0) {
        this.dirty = false;
      }
      this.fileList = [...this.fileList, ...list];
      // this.fileList.push(...list);
      this.page = page;
    } finally {
      this.loading = false;
    }
  }

  // async back() {
  //   if (this.dir !== '/') {
  //     this.reload(this.dir.substr(0, this.dir.lastIndexOf('/')));
  //   }
  // }

  async reload(dir?: string) {
    if (dir != null) {
      this.dir = dir;
    }
    await this.loadData(0);
  }

  async loadNextPage() {
    if (this.hasMore) {
      await this.loadData(this.page + 1);
    }
  }

  // async loadImage(index: number) {
  //   const ids = this.fileList.map((file) => file.fs_id);
  //   const result = await this.baiduAPIService.multimedia(ids);
  // }
}
