import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyDatePipe } from './pipe/my-date.pipe';
import { FileSizePipe } from './pipe/file-size.pipe';

@NgModule({
  declarations: [MyDatePipe, FileSizePipe],
  imports: [CommonModule],
  exports: [MyDatePipe,FileSizePipe],
})
export class SharedModule {}
