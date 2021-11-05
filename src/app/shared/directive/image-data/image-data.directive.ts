import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Directive({
  selector: 'canvas[imageData]',
})
export class ImageDataDirective implements OnChanges {
  @Input()
  imageData: ImageData;

  constructor(private elementRef: ElementRef<HTMLCanvasElement>) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (this.imageData) {
      const canvas = this.elementRef.nativeElement;
      canvas.width = this.imageData.width;
      canvas.height = this.imageData.height;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(this.imageData, 0, 0);
    }
  }
}
