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
SwiperCore.use([Zoom, Navigation, Pagination, Virtual, Lazy]);

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent implements OnInit {
  id: number;
  index: number;
  image: string;
  @ViewChild('swiperRef', { static: false }) swiperRef?: SwiperComponent;
  constructor(
    private route: ActivatedRoute,
    public fileService: FileService,
    private baiduAPIService: BaiduAPIService,
    private zone: NgZone
  ) {
    route.queryParams.subscribe((params) => {
      this.id = +params.id;
      this.index = +params.index;
      this.reload();
    });
  }

  ngOnInit() {}

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

  slideTo(index: number) {
    this.swiperRef.swiperRef.slideTo(index - 1, 0);
  }

  onSlideChange(event: any) {
    this.zone.run(() => {
      this.index = event.activeIndex;
      if (
        this.fileService.fileList.length < this.index + 3 &&
        this.fileService.hasMore
      ) {
        this.fileService.loadNextPage();
      }
    });
  }
}
