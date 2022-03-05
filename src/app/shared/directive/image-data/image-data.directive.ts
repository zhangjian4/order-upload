import {
  Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import { fromEvent, Subject, takeUntil } from 'rxjs';
import { Database } from 'src/app/core/service/database.service';

@Directive({
  selector: 'img[imageData]',
})
export class ImageDataDirective implements OnChanges, OnDestroy {
  @Input()
  imageData: ImageData | number;
  @Input()
  maxHeight: number;
  @Input()
  maxWidth: number;

  @Output()
  imageLoad = new EventEmitter<HTMLImageElement>();
  destroy$ = new Subject<void>();
  objectUrl: string;

  constructor(
    private elementRef: ElementRef<HTMLImageElement>,
    private database: Database
  ) {}

  ngOnInit(): void {
    fromEvent(this.element, 'load')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.imageLoad.emit(this.element);
        // this.revokeObjectURL();
      });
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.revokeObjectURL();
  }

  async reload() {
    // TODO
    this.revokeObjectURL();
    if (this.imageData) {
      let imageData: ArrayBuffer;
      if (this.imageData instanceof ArrayBuffer) {
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
        // const image = this.elementRef.nativeElement;
        const blob = new Blob([imageData]);
        this.objectUrl = URL.createObjectURL(blob);
        this.element.src = this.objectUrl;
        // canvas.width = imageData.width;
        // canvas.height = imageData.height;
        // const ctx = canvas.getContext('2d');
        // ctx.putImageData(imageData, 0, 0);
        // this.imageLoad.emit(canvas);
      }
    }
  }

  revokeObjectURL() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  get element(): HTMLImageElement {
    return this.elementRef.nativeElement;
  }
}
