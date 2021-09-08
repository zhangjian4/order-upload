import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DbImageDirective } from './db-image.directive';

@NgModule({
  declarations: [DbImageDirective],
  imports: [CommonModule],
  exports: [DbImageDirective],
})
export class DbImageModule {}
