import { Directive, ElementRef, Input, SimpleChanges } from '@angular/core';
import { Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Database } from 'src/app/core/service/database.service';

@Directive({
  selector: '[blob-src]'
})
export class BlobSrcDirective {

  @Input('blob-src')
  blob: Blob;
  destroy$ = new Subject<void>();
  objectUrl: string;
  constructor(private database: Database, private elementRef: ElementRef) {}

  ngOnInit(): void {
    fromEvent(this.element, 'load')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.revokeObjectURL();
      });
  }
  ngOnChanges(changes: SimpleChanges): void {
    this.updateSrc();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.revokeObjectURL();
  }

  revokeObjectURL() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  updateSrc() {
    this.revokeObjectURL();
    if(this.blob){
      this.objectUrl = URL.createObjectURL(this.blob);
      this.element.src = this.objectUrl;
    }else{
      this.element.removeAttribute('src');
      // this.element.src = null;
    }
  }

  get element(): HTMLImageElement {
    return this.elementRef.nativeElement;
  }

}
