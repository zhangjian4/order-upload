import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BaiduAPIService } from '../core/service/baidu-api.service';
import { FileService } from '../core/service/file.service';
import SwiperCore, {
  Zoom,
  Navigation,
  Pagination,
  Virtual,
  Lazy,
} from 'swiper';
import { SwiperComponent } from 'swiper/angular';
import { SwiperEvents } from 'swiper/types';

// install Swiper modules
SwiperCore.use([Zoom, Virtual, Lazy]);

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent implements OnInit {
  @ViewChild('swiperRef', { static: false }) swiperRef?: SwiperComponent;
  id: number;
  index: number;
  image: string;
  initIndex: number;
  items: any[];
  inited: boolean;
  constructor(
    private route: ActivatedRoute,
    public fileService: FileService,
    private baiduAPIService: BaiduAPIService,
    private zone: NgZone
  ) {
    route.queryParams.subscribe((params) => {
      this.id = +params.id;
      // this.index = this.initIndex = +params.index;
      // this.reload();
    });
  }

  ngOnInit() {
    this.initIndex = 0;
    this.items = [];
    this.fileService.fileList.forEach((item) => {
      if (item.thumbs) {
        this.items.push(item);
        if (item.fs_id === this.id) {
          this.index = this.initIndex = this.items.length - 1;
        }
      }
    });
    setTimeout(() => {
      this.inited = true;
    });
  }

  async reload() {
    while (
      this.fileService.fileList.length <= this.index &&
      this.fileService.hasMore
    ) {
      await this.fileService.loadNextPage();
    }
    // this.fileService.loadImage(this.index);
    // const result = await this.baiduAPIService.multimedia([this.id]);
    // this.image = await this.baiduAPIService.getDlink(result.list[0].dlink);
    // console.log(result);
  }

  onSlideChange(event: any) {
    this.zone.run(() => {
      this.index = event[0].activeIndex;
      // if (
      //   this.fileService.fileList.length < this.index + 3 &&
      //   this.fileService.hasMore
      // ) {
      //   this.fileService.loadNextPage();
      // }
    });
  }
}
