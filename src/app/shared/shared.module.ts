import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyDatePipe } from './pipe/my-date.pipe';

@NgModule({
  declarations: [MyDatePipe],
  imports: [CommonModule],
  exports: [MyDatePipe],
})
export class SharedModule {}
