import { Injectable, OnDestroy } from '@angular/core';

@Injectable()
export class PreuploadService implements OnDestroy {
  ngOnDestroy(): void {
    console.log('destroy');
  }
}
