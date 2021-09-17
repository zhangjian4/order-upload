import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
    const { offsetTop, offsetLeft, offsetHeight, offsetWidth, naturalHeight } =
      img;
    this.ratio = offsetHeight / naturalHeight;
    this.top = offsetTop;
    this.left = offsetLeft;
    this.bottom = offsetTop + offsetHeight;
    this.right = offsetLeft + offsetWidth;
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
    fromEvent(document, 'touchmove')
      .pipe(takeUntil(mouseup))
      .subscribe((e: TouchEvent) => {
        const touchMove = e.touches.item(0);
        const x = startX + touchMove.clientX;
        const y = startY + touchMove.clientY;
        point.x = this.limit(x, this.left, this.right);
        point.y = this.limit(y, this.top, this.bottom);
        this.updatePolygon();
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
}
