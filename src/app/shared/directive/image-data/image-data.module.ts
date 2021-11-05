import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageDataDirective } from './image-data.directive';

@NgModule({
  declarations: [ImageDataDirective],
  imports: [CommonModule],
  exports: [ImageDataDirective],
})
export class ImageDataModule {}
