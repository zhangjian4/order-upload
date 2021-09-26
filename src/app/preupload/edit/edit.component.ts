import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import cv, { Point } from 'opencv-ts';
import { fromEvent, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { Database, IUploadFile } from 'src/app/core/service/database.service';
import SwiperCore, { Pagination, Navigation, Virtual } from 'swiper';
import { AlertController, NavController } from '@ionic/angular';
import { PreuploadService } from 'src/app/core/service/preupload.service';

SwiperCore.use([Virtual, Pagination, Navigation]);

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class EditComponent implements OnInit, OnDestroy {
  data: IUploadFile;
  points: any[];

  polygon: string;
  top: number;
  left: number;
  bottom: number;
  right: number;
  ratio: number;
  initIndex: number;
  index: number;

  destroy$ = new Subject();
  moving: boolean;
  magnifyRatio = 2; // 放大镜放大倍数
  magnifyTransform: string;
  magnifyWidth: number;
  magnifyPositionRight: boolean;
  inited: boolean;

  constructor(
    public preuploadService: PreuploadService,
    private route: ActivatedRoute,
    private zone: NgZone,
    private cd: ChangeDetectorRef,
    private alertController: AlertController,
    private database: Database,
    private navController: NavController
  ) {
    route.queryParams.subscribe((params) => {
      if (params.index != null) {
        this.initIndex = +params.index;
        this.index = this.initIndex;
        this.data = this.preuploadService.data[this.index];
      }
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    setTimeout(() => {
      this.inited = true;
    });
    // this.data = this.preuploadService.data[this.index];
  }

  onImageLoad(event: Event, item: IUploadFile, index: number) {
    if (index === this.index) {
      const img = event.target as HTMLImageElement;
      this.data = item;
      this.updateImage(img);
    }
  }

  updateImage(img: HTMLImageElement) {
    const {
      offsetTop,
      offsetLeft,
      offsetHeight,
      offsetWidth,
      naturalWidth,
      naturalHeight,
    } = img;
    if (naturalHeight && naturalWidth) {
      this.ratio = offsetWidth / naturalWidth;
      this.magnifyWidth = naturalWidth * this.magnifyRatio;
      this.top = offsetTop;
      this.left = offsetLeft;
      this.bottom = offsetTop + offsetHeight;
      this.right = offsetLeft + offsetWidth;
      if (!this.data.rect) {
        this.data.rect = [
          { x: 0, y: 0 },
          { x: naturalWidth, y: 0 },
          { x: naturalWidth, y: naturalHeight },
          { x: 0, y: naturalHeight },
        ];
      }
      this.points = this.data.rect.map((p) => ({
        x: p.x * this.ratio + this.left,
        y: p.y * this.ratio + this.top,
      }));
      this.updatePolygon();
    }
  }

  onPointClick(event) {
    console.log(event);
  }

  onPointMousedown(event: TouchEvent, point: any) {
    this.zone.run(() => {
      event.stopPropagation();
      const touchStart = event.touches.item(0);
      const startX = point.x - touchStart.clientX;
      const startY = point.y - touchStart.clientY;
      const mouseup = fromEvent(document, 'touchend').pipe(take(1));
      this.moving = true;
      this.updateMagnify(point);
      fromEvent(document, 'touchmove')
        .pipe(takeUntil(mouseup))
        .subscribe((e: TouchEvent) => {
          console.log(e);
          const touchMove = e.touches.item(0);
          point.x = this.limit(
            startX + touchMove.clientX,
            this.left,
            this.right
          );
          point.y = this.limit(
            startY + touchMove.clientY,
            this.top,
            this.bottom
          );
          this.updatePolygon();
          this.updateMagnify(point);
        });
      mouseup.subscribe(() => {
        this.moving = false;
        const points = this.points.map(
          (p) =>
            new cv.Point(
              (p.x - this.left) / this.ratio,
              (p.y - this.top) / this.ratio
            )
        );
        this.preuploadService.updateRect(this.data, points);
      });
    });
  }

  limit(num: number, min: number, max: number) {
    return Math.max(Math.min(num, max), min);
  }

  updatePolygon() {
    if (this.points) {
      this.polygon = this.points
        .map((point) => point.x + ',' + point.y)
        .join(' ');
    }
  }

  updateMagnify({ x, y }: Point) {
    if (y < 150) {
      const center = (this.left + this.right) / 2;
      if (!this.magnifyPositionRight && x < center) {
        this.magnifyPositionRight = true;
      } else if (this.magnifyPositionRight && x > center) {
        this.magnifyPositionRight = false;
      }
    }

    const translateX = ((this.left - x) * this.magnifyRatio) / this.ratio;
    const translateY = ((this.top - y) * this.magnifyRatio) / this.ratio;
    this.magnifyTransform = `translate(${translateX}px,${translateY}px)`;
  }

  onSlideChange(event: any) {
    if (this.index !== event.activeIndex) {
      this.zone.run(() => {
        this.setIndex(event.activeIndex);
        // this.index = event.activeIndex;
        // this.data = this.preuploadService.data[this.index];
        // const img = document.getElementById(
        //   'image-' + this.index
        // ) as HTMLImageElement;
        // if (img) {
        //   this.updateImage(img);
        // }
      });
    }
  }

  setIndex(index: number) {
    this.index = index;
    this.data = this.preuploadService.data[this.index];
    if (this.data) {
      const img = document.getElementById(
        'image-' + this.data.id
      ) as HTMLImageElement;
      if (img) {
        this.updateImage(img);
      }
    }
  }

  async remove() {
    const alert = await this.alertController.create({
      message: `是否确认删除？`,
      backdropDismiss: false,
      buttons: [
        {
          text: '取消',
          role: 'cancel',
        },
        {
          text: '确定',
          handler: async () => {
            await this.preuploadService.remove(this.data);
            const length = this.preuploadService.data.length;
            if (length === 0) {
              this.navController.navigateBack('/camera');
              return;
            }
            let index = this.index;
            if (index >= length) {
              index = length - 1;
            }

            this.initIndex = index;
            this.setIndex(index);
            this.inited = false;
            setTimeout(() => {
              this.inited = true;
            });
          },
        },
      ],
    });
    await alert.present();
  }
}
