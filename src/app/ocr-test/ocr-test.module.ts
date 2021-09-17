import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OcrTestComponent } from './ocr-test.component';



@NgModule({
  declarations: [OcrTestComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: OcrTestComponent,
      },
    ]),
  ]
})
export class OcrTestModule { }
