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
  points = [
    { x: 0, y: 0 },
    { x: 300, y: 30 },
    { x: 300, y: 500 },
    { x: 10, y: 400 },
  ];

  polygon: string;
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
    console.log(event.target);
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
        let x = startX + touchMove.clientX;
        let y = startY + touchMove.clientY;
        x = Math.max(x, 0);
        y = Math.max(y, 0);
        point.x = x;
        point.y = y;
        this.updatePolygon();
      });
  }

  updatePolygon() {
    this.polygon = this.points
      .map((point) => point.x + ',' + point.y)
      .join(' ');
  }
}
