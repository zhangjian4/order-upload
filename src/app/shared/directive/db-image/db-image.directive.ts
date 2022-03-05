import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { from, fromEvent, Subject } from 'rxjs';
import { Database } from 'src/app/core/service/database.service';
import { takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[appDbImage]',
})
export class DbImageDirective implements OnChanges, OnInit, OnDestroy {
  @Input()
  table: string;
  @Input()
  index: number | string;
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
    this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.revokeObjectURL();
  }

  async reload() {
    if (this.table && this.index) {
      const data = await this.database[this.table].get(this.index);
      const blob = data.blob;
      this.updateSrc(blob);
    }
  }

  revokeObjectURL() {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }

  updateSrc(blob: Blob) {
    this.revokeObjectURL();
    if(blob){
      this.objectUrl = URL.createObjectURL(blob);
      this.element.src = this.objectUrl;
    }
  }

  get element(): HTMLImageElement {
    return this.elementRef.nativeElement;
  }
}
