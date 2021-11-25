import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Database } from 'src/app/core/service/database.service';

@Directive({
  selector: 'canvas[imageData]',
})
export class ImageDataDirective implements OnChanges, OnDestroy {
  @Input()
  imageData: ImageData | number;
  @Input()
  maxHeight: number;
  @Input()
  maxWidth: number;

  @Output()
  imageLoad = new EventEmitter<HTMLCanvasElement>();

  constructor(
    private elementRef: ElementRef<HTMLCanvasElement>,
    private database: Database
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    this.reload();
  }

  ngOnDestroy(): void {
    const canvas = this.elementRef.nativeElement;
    canvas.width = 0;
    canvas.height = 0;
  }

  async reload() {
    if (this.imageData) {
      let imageData: ImageData;
      if (this.imageData instanceof ImageData) {
        imageData = this.imageData;
      } else {
        const record = await this.database.imageData.get(
          this.imageData as number
        );
        if (record) {
          imageData = record.data;
        }
      }
      if (imageData) {
        const canvas = this.elementRef.nativeElement;
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        this.imageLoad.emit(canvas);
      }
    }
  }
}
