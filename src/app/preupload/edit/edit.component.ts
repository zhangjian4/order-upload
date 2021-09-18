import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import cv, { Point } from 'opencv-ts';
import { fromEvent, Subject } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { IUploadFile } from 'src/app/core/service/database.service';
import { PreuploadService } from '../preupload.service';

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

  destroy$ = new Subject();
  moving: boolean;
  magnifyRatio = 2; // 放大镜放大倍数
  magnifyTransform: string;
  magnifyWidth: number;
  magnifyPositionRight: boolean;

  constructor(
    public preuploadService: PreuploadService,
    private route: ActivatedRoute
  ) {
    route.queryParams.subscribe((params) => {
      if (params.index != null) {
        this.data = this.preuploadService.data[params.index];
      }
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit() {
    this.updatePolygon();
  }

  onImageLoad(event: Event) {
    const img = event.target as HTMLImageElement;
    const {
      offsetTop,
      offsetLeft,
      offsetHeight,
      offsetWidth,
      naturalWidth,
      naturalHeight,
    } = img;
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

  onPointClick(event) {
    console.log(event);
  }

  onPointMousedown(event: TouchEvent, point: any) {
    const touchStart = event.touches.item(0);
    const startX = point.x - touchStart.clientX;
    const startY = point.y - touchStart.clientY;
    const mouseup = fromEvent(document, 'touchend').pipe(take(1));
    this.moving = true;
    this.updateMagnify(point);
    fromEvent(document, 'touchmove')
      .pipe(takeUntil(mouseup))
      .subscribe((e: TouchEvent) => {
        const touchMove = e.touches.item(0);
        point.x = this.limit(startX + touchMove.clientX, this.left, this.right);
        point.y = this.limit(startY + touchMove.clientY, this.top, this.bottom);
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
}
