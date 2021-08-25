import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyDatePipe } from './pipe/my-date.pipe';
import { FileSizePipe } from './pipe/file-size.pipe';
import { ThumbsUrlPipe } from './pipe/thumbs-url.pipe';
import { HighlightPipe } from './pipe/highlight.pipe';

@NgModule({
  declarations: [MyDatePipe, FileSizePipe, ThumbsUrlPipe, HighlightPipe],
  imports: [CommonModule],
  exports: [MyDatePipe,FileSizePipe,ThumbsUrlPipe,HighlightPipe],
})
export class SharedModule {}
